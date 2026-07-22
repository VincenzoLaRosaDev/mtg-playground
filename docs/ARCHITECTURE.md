# MTGPlayground — Architecture

> Last updated: 2026-07-22 · Product pivot from EDHForge; package/UI = MTGPlayground; `printings` via default_cards

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL on Neon (free tier, Europe Central) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Auth.js v5 — Google + Discord + Resend magic link; Prisma Adapter; JWT sessions |
| Styling | Tailwind CSS 4 |
| Charts | Recharts (Phase 3) |
| Jobs | Node scripts + GitHub Actions cron |
| Hosting | Vercel (app) + Neon (DB) |

## Prisma 7 notes

- Client generated to `src/generated/prisma/` (gitignored; `postinstall` runs `prisma generate`)
- Import: `import { PrismaClient } from "@/generated/prisma/client"`
- Runtime: must pass `{ adapter: new PrismaPg({ connectionString }) }` — empty constructor throws
- Sync/CLI: `createScriptPrismaClient()` uses `pg.Pool({ max: 5 })` + `disposeExternalPool: true` (app runtime keeps default adapter config)
- CLI/migrations: `prisma.config.ts` uses `DIRECT_URL` for `datasource.url`
- App runtime: `DATABASE_URL` (pooled Neon connection)
- Use `sslmode=verify-full` in connection URLs (app normalizes legacy `sslmode=require` at runtime to silence pg v8 warnings)

## Environment variables

```bash
DATABASE_URL=   # Neon pooled (-pooler host); ?sslmode=verify-full — also GitHub Actions secret for sync jobs
DIRECT_URL=     # Neon direct (migrations only); ?sslmode=verify-full
NEXT_PUBLIC_SITE_URL=  # Production URL for SEO (optional locally)
AUTH_SECRET=    # Phase 2
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET=
AUTH_DISCORD_ID / AUTH_DISCORD_SECRET=
```

See `.env.example`. Sync workflows run `npm run sync:*` scripts with `DATABASE_URL` — there is no app `/api/sync` endpoint.

## Data sources (external-first)

```
Tier 0  Scryfall oracle_cards     → oracle identity, legalities, inclusion rank, GC, …
Tier 0b Scryfall default_cards    → printings (set/cn/finish/faces/prices)
Tier 1  MTGJSON decks             → official precon decklists (Phase 2.3)
Tier 2  Our engine                → classifications, deck legality, analysis
Tier 3  Platform data             → collection, decks, ratings, rankings (Phase 2.1+)
```

EDHREC removed (2026-07-20). No third-party meta scrape. See pivot decision in `docs/DECISIONS.md`.

### Scryfall

| Bulk / API | Use | Join key |
|---|---|---|
| `oracle_cards` | Oracle catalog | `id`, `oracle_id` |
| `default_cards` | Printings index (finish, faces, prices) | Scryfall `id`; `oracle_id`, set+cn |
| `oracle_tags` | Roles + themes | `oracle_id` |
| Sets API | Set metadata (`mtg_sets`) | `code` |

- Download via `GET api.scryfall.com/bulk-data/…`
- **No live API in hot path** — autocomplete/search from local Postgres
- **Excluded layouts:** `art_series` (and other non-playable as configured)
- Slug helpers: `toCardSlug`; resolution prefers playable rows
- Images: hotlink `cards.scryfall.io` (incl. `card_faces` imagery for multiface)
- **Popularity / Inclusion:** `edhrec_rank` = Commander **inclusion** rank only — UI label **Inclusion**; never “as commander” popularity. Commanders browse is name-first; Inclusion still shown on tiles with honest copy.

### MTGJSON (Phase 2.3)

- `DeckList.json` + individual deck files for precons
- Sync monthly + on new product release

## Sync schedule

| Job | When | Script |
|---|---|---|
| Scryfall oracle_cards | Daily 03:00 UTC | `scripts/sync/scryfall-process.ts` (skips `art_series`) |
| Purge art_series | One-time / after bad import | `scripts/sync/purge-art-series.ts` |
| Scryfall sets metadata | Weekly Sunday | `scripts/sync/scryfall-sets.ts` |
| Scryfall printings | Weekly Sunday (`--if-changed`) | `scripts/sync/scryfall-printings.ts` (`default_cards` bulk) |
| Scryfall oracle_tags | Weekly Sunday | `scripts/sync/scryfall-tags.ts` (`--if-changed`) |
| Card classifications | Weekly Sunday (after tags) | `scripts/sync/compute-card-classifications.ts` |
| Rankings recompute | Weekly | `scripts/sync/recompute-rankings.ts` (Phase 4) |
| MTGJSON precons | Monthly | `scripts/sync/mtgjson-precons.ts` (Phase 5) |

GitHub Actions (`.github/workflows/sync-*.yml`): **temporarily disabled** (`SYNC_JOBS_ENABLED: "false"`, cron commented out) until `DATABASE_URL` is set on GitHub and syncs are intentionally enabled — see `README.md` § GitHub Actions. When enabled: Scryfall daily/weekly sync only.

Daily Scryfall runs fetch bulk metadata only when `updated_at` matches the last successful sync (`sync_logs.errors.bulkUpdatedAt`); full download runs when Scryfall publishes a new bulk file.

**Sync write path (Wave C):** oracle cards and printings upsert in batches of ~200 via parameterized `INSERT … ON CONFLICT` (`$executeRaw`) — cards conflict on `oracle_id` (keep existing `id`); printings conflict on `id`. Friction recompute after classifications is one SQL `UPDATE` joining taggings/tags (`FRICTION_TAG_SLUGS`), not per-row Prisma updates.

## SEO

- `NEXT_PUBLIC_SITE_URL` — canonical base for metadata, `/sitemap.xml`, `/robots.txt`
- `src/lib/seo/site.ts` — shared `createPageMetadata()` helper
- Dynamic `generateMetadata` on card/set detail pages (`/commanders/[slug]` redirects)
- Sitemap: static routes + playable `cards` rows (`cards.slug`) for `/cards/{slug}` (capped) + all sets (revalidates daily)

## Application architecture

```
Browser
  └─ Analysis engine (client-side TS, Phase 2+) — lookup pre-computed card roles
Next.js App Router
  ├─ SSR pages: /browse, /cards/[slug], /sets/[code], … (/commanders/[slug] → redirect)
  ├─ Browse lists: RSC page loads first page via lib/browse → client island for filters / load-more
  ├─ API routes: /api/search, /api/browse, /api/sets/search (pagination + filter changes)
  └─ Domain logic: src/lib/ (browse, discovery, scryfall, classification, …); src/services/ Phase 2+
PostgreSQL
  ├─ cards (+ popularity/GC/friction; roles/themes in card_classifications; slug via toCardSlug)
  ├─ printings / mtg_sets
  ├─ decks, deck_publications, publication_ratings (Phase 2 / 4)
  └─ sync_logs
```

**Rule:** user-facing **browse/search/detail** routes read Postgres only (Scryfall catalog). No live external meta APIs in the hot path. `/cards` and `/catalog` → `/browse`; `/commanders` → `/browse?commanders_only=true`.

## Discovery browse APIs (Phase 1.8 hub)

Common list contract for `/api/browse`, legacy `/api/cards/browse` / `/api/commanders/browse`, `/api/sets/search`, and `GET /api/search`:

```
Query:  limit, cursor, sort, order, format, commanders_only, + resource-specific filters
Response: { items: T[], total: number, nextCursor: string | null }
```

| Endpoint | Purpose |
|---|---|
| `GET /api/browse` | Unified hub browse; default Inclusion sort; `commanders_only=true` (or legacy `entity=commanders`) → `isCommander` + Name sort default; `format=` → `legalities[format] === "legal"` |
| `GET /api/cards/browse` | Legacy catalog browse (same query stack; optional `commanders_only` / `format`) |
| `GET /api/commanders/browse` | Legacy commanders wrapper (`is_commander` + require slug) |
| `GET /api/search?q=` | Unified navbar + `/search` (cards + sets; cards via weighted FTS on name/type/oracle; legal commanders flagged) |
| `GET /api/sets/search` | Cursor browse for sets |

**Browse facets (v1):** color identity, CMC min/max, type contains, Role, Theme, **Format** (curated Scryfall keys via `src/lib/formats/scryfall-formats.ts`; JSONB path equals `legal`; legacy `commander=legal` → `format=commander`), Game Changer, Reserved, **Commander** (`isCommander` via `commanders_only`), rarity. No **price band** filter — oracle catalog prices are for one Scryfall representative printing, not min/max across versions. **Role/Theme selects** are hide-empty against `card_classifications` (closed enums in `FUNCTIONAL_ROLES` / `SYNERGY_THEMES`; fall back to full enum if classifications are empty). **Sort:** `popularity` (Inclusion / Commander — default when Format is Any or Commander), `color` (Color & CMC via denormalized `color_sort` — default for other formats), name, cmc, price (EUR-first, representative printing). Options Commander (`commanders_only`) defaults sort to Name.

**Sets browse:** set-type select options come from `DISTINCT mtg_sets.set_type` (`listDistinctSetTypes`), not a hardcoded subset.

**Card enrichment columns:** `popularity_rank` (Scryfall `edhrec_rank`), `color_sort` (Arena/Scryfall color order key from `colors[]`; set at sync + migration backfill), `search_document` (oracle + face text corpus), `search_tsv` (DB-generated weighted tsvector), `is_game_changer`, `is_reserved`, `friction_score`, `mana_cost`, `power`/`toughness`/`loyalty`.

**Card text search:** browse `q` and `GET /api/search` share FTS on `search_tsv` via `to_tsquery`. **Hybrid:** tokens joined with `<->` (phrase adjacency); **last token always gets `:*` prefix** so partial typing works (`destroy all creatu`, `day of judgmen`). Single-token queries are `token:*`. Not fuzzy for typos in the middle of a word. Type contains remains a separate AND filter. Apostrophes are stripped on both query sanitize and the generated `search_tsv` (so `Y'shtola` / `Yshtola` match).

**Friction:** denormalized on `cards.friction_score` — +2 if Game Changer, +1 if friction-family oracle tag; capped at 3; recomputed in `sync:compute-classifications`.

**SSR default hydrate cache:** `/browse` first paint uses `unstable_cache` (`src/lib/browse/browse-cache.ts`, tag `browse-hub`, revalidate 1h). Filtered/cursor API requests are uncached.

Legacy `GET /api/cards/search` and `GET /api/commanders/search` were removed (2026-07-16) — superseded by `/api/search`.

**Card detail printing context:** `/cards/{slug}?set={code}&cn={collector}&finish={foil|etched}` — `resolveCardPrinting` / `listOraclePrintings` in `src/lib/scryfall/card-printing.ts`. No `set` → catalog default printing (`cards.id` === `printings.id`, else `image_uri` match) with set/cn/finishes filled for the VersionPicker. `set` only → lowest `collector_number` in that set. `set`+`cn` → exact printing. `finish` (omit = nonfoil) drives price chip preference and a CSS foil/etched sheen on the hero (Scryfall art is shared across finishes). VersionPicker lists real printings only (no “Catalog default” row). Set detail and commander redirects preserve version params via `buildCardVersionHref`.

**Detail route:** `/cards/[slug]` is the sole **catalog** oracle hub (`findPlayableCardBySlug`). **Overview band:** Inclusion / Legal commander / GC / Friction / Reserved + **staggered multiface** + VersionPicker / prices (+ Show all versions sheet). **Lists band:** As card (similar + relatives) by default; when `isCommander`, **As card | As commander** toggle via `?view=commander` switches to D2 pack (role staples / GC in CI / build skeleton) with sticky TOC. `/commanders/[slug]` permanentRedirects here (preserves `set`/`cn`/`finish`).

**Workspace overlays (Phase 2.2):** Deck editor (and similar workspaces) keep the page mounted and open cards via `CardPeekSheet` + `WorkspaceSearchOverlay` (mutate local state; optional “Open full page”). `VersionPicker` / `VersionsBrowser` accept `onSelectPrinting` for embeds; PDP default remains `router.push`. See `docs/DECISIONS.md` (2026-07-22 workspace overlays). Same D2 helpers remain available for deck-builder insights (Phase 2.2.6).

## Folder structure

```
edhforge/
├── AGENTS.md                 ← agent entry point
├── docs/                     ← product + architecture docs (maintain these!)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   ├── sync/                 ← batch jobs (Scryfall, …)
│   ├── data/                 ← card-overrides.json
│   └── dev/                  ← db-health-snapshot, etc.
├── packages/
│   └── analysis/             ← pure TS engine (Phase 2+; not created yet)
├── src/
│   ├── app/                  ← Next.js routes + api/
│   ├── components/
│   │   ├── layout/           ← app shell, page shell, theme
│   │   ├── discovery/        ← browse/detail catalog UI
│   │   ├── mtg/              ← mana / rarity icons
│   │   ├── ui/               ← shadcn primitives
│   │   └── dev/              ← catalog debug (gated)
│   ├── hooks/                ← client hooks (e.g. useBrowseList)
│   ├── lib/                  ← domain logic (+ colocated `*.test.ts`, Vitest)
│   │   ├── db.ts / db/       ← Prisma client + connection helpers
│   │   ├── browse/           ← browse query + param parsing
│   │   │   ├── cards.ts      ← facade: parse + queryCardsBrowse
│   │   │   ├── cards-filters.ts / cards-params.ts / cards-catalog.ts
│   │   │   └── commanders.ts · sets.ts · browse-cache.ts · …
│   │   ├── scryfall/         ← catalog filters, slug helpers, bulk client, prices
│   │   ├── classification/   ← roles/themes (batch / sync)
│   │   ├── search/           ← global search
│   │   ├── seo/ · ui/ · mtg/ · display/ · catalog/ · dev/
│   │   └── utils.ts          ← cn()
│   └── generated/prisma/     ← gitignored
└── .cursor/rules/            ← Cursor agent rules
```

Tests: `npm test` (Vitest). No DB required for current unit suite.

## Database schema (current + planned)

### Implemented (Phase 0 + 1.7 + 1.8 + 2.0.5)

- `cards` — Scryfall oracle card data; `slug` (`toCardSlug`) for routes; enrichment: `popularity_rank`, `is_game_changer`, `is_reserved`, `friction_score`, `mana_cost`, `power`/`toughness`/`loyalty`, **`faces` Json** (multiface); denorm **`list_price_eur`** (browse price sort) + **`min_rarity` / `min_rarity_rank`** (oracle lowest printing tier, refreshed at printings sync)
- `scryfall_oracle_tags` — Tagger tag metadata (slug, label)
- `card_oracle_taggings` — raw `(oracle_id, tag_id, weight)` for catalog cards; unique `(oracle_id, tag_id)` covers oracle lookups (no separate `oracle_id`-only index)
- `card_classifications` — derived `roles[]` + `themes[]` per oracle (override or oracle tag); also drives Friction tag +1; GIN on `roles` / `themes`
- `mtg_sets` — set metadata (code, name, release, type)
- `printings` — one Scryfall printing per row (set + collector #; finishes, faces, prices); soft-join via `oracle_id`; index `(oracle_id, released_at DESC)`
- `sync_logs` — job audit trail (indexes on `(source, job_type, started_at)` and `(source, job_type, status, completed_at)`)

**Auth + collection (Phase 2.1):**
- `users`, `accounts`, `sessions`, `verification_tokens` — Auth.js (NextAuth v5) + Prisma Adapter; app sessions are **JWT** (edge-safe middleware) while users/accounts persist in Postgres
- `collection_items` — `(user_id, printing_id, finish, wantlist)` unique; owned and wish are separate rows; `quantity` ≥ 1 per row; FK to `users` + `printings`
- `/collection` query: paginated (`cursor` / page size 48); scope `filter` (`all` / owned / wish), sort `sort`/`order`, facets scoped to the user’s inventory oracles (not full-catalog scans)

**Removed (Phase 1.7):** `edhrec_commander_profiles`, `edhrec_card_data`, `edhrec_top_entries`, `edhrec_page_variants`; column rename `edhrec_slug` → `slug`.

**Removed (Phase 2.0.5):** `set_cards` (replaced by `printings`).

**Removed (2026-07-20):** `card_relations` + `CardRelationComponent` (Scryfall `all_parts` / Related parts on PDP — low value).

**Hot indexes:** `cards.cmc`, `cards.layout`, `cards.popularity_rank`, `cards.is_game_changer`, `cards.is_reserved`, `cards.friction_score`, `cards.color_sort`, `cards.list_price_eur`, `cards.min_rarity_rank`. **FTS:** `cards.search_tsv` GIN. **GIN arrays:** `cards.color_identity`, `card_classifications.roles` / `themes`.

### Neon cost hygiene (2026-07-22)

Compute hours dominate over storage (~236 MB catalog). Mitigations: bounded FTS id lists for browse `q`; denorm price/rarity; collapsed commander detail-pack queries; collection pagination + user-scoped facets; sync bulk `INSERT … ON CONFLICT` (oracle + printings); friction via one SQL `UPDATE`; script Prisma pool `max: 5`.

### Planned (Phase 2.2+)

- `decks`, `deck_cards` (multi-format)
- `deck_publications`, `publication_ratings`, ranking snapshots (Phase 4)

See `docs/PROJECT.md` for entity semantics.

## Card classification pipeline (batch, post-sync)

```
card_overrides.json (manual)
        ↓ overrides
Scryfall oracle_tags bulk
        ↓ fills gaps
Conservative regex on oracle_text
        ↓
computed roles[] + themes[] stored in card_classifications (batch via compute-card-classifications.ts)
        ↓ also
cards.friction_score (GC + friction-family otags)
```

Classification sources: `scripts/data/card-overrides.json` (232 staples, `oracle_id` key) → Scryfall oracle tags (weight ≥ median, excludes `weak`) → regex deferred to Phase 3. Mapping: `src/lib/classification/tag-mapping.ts`.

## Ranking algorithm (Phase 4)

- Bayesian average per axis (power, budget, originality)
- Min 3 votes in rolling 7-day window to appear in weekly rankings
- Separate leaderboards: global, per commander, per theme
- Display: `8.2 ★ (24 votes)` + brewer declared vs community for power

## Security notes

- Never commit `.env.local`
- Sync jobs authenticate via GitHub Actions repository secret `DATABASE_URL` (scripts run in CI, not via public HTTP)
- Rate-limit public API routes in production (Phase 5)
