# EDHForge — Architecture

> Last updated: 2026-07-16

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL on Neon (free tier, Europe Central) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Auth.js v5 — email + Google + Discord (Phase 2) |
| Styling | Tailwind CSS 4 |
| Charts | Recharts (Phase 3) |
| Jobs | Node scripts + GitHub Actions cron |
| Hosting | Vercel (app) + Neon (DB) |

## Prisma 7 notes

- Client generated to `src/generated/prisma/` (gitignored; `postinstall` runs `prisma generate`)
- Import: `import { PrismaClient } from "@/generated/prisma/client"`
- Runtime: must pass `{ adapter: new PrismaPg({ connectionString }) }` — empty constructor throws
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
Tier 0  Scryfall bulk     → card catalog, legalities, prices, oracle tags
Tier 1  EDHREC JSON       → commander meta, staples, salt, synergy, themes
Tier 2  MTGJSON decks     → official precon decklists (Phase 5)
Tier 3  Our engine        → regex/otag gaps, live editor analysis
Tier 4  Platform data     → ratings, rankings (Phase 4+)
```

### Scryfall

| Bulk file | Use | Join key |
|---|---|---|
| `oracle_cards` | Card catalog (~30k) | `id`, `oracle_id` |
| `oracle_tags` | Functional roles + themes | `oracle_id` |

- Download via `GET api.scryfall.com/bulk-data/oracle-cards` → `jsonl_download_uri`
- **No live API in hot path** — autocomplete/search from local Postgres
- **Excluded layouts:** `art_series` (Art Series collectibles — not tournament-legal; share EDHREC slugs with playable cards). Filtered at sync (`shouldIndexScryfallCard`) and in queries (`playableCatalogCardWhere`). One-time cleanup: `npm run sync:purge-art-series`.
- Slug resolution: `findPlayableCardByEdhrecSlug` prefers commander-legal rows when multiple oracle cards share a slug.
- Sync: check daily, full reprocess weekly + on set release
- Images: hotlink `cards.scryfall.io` (configured in `next.config.ts`)

### EDHREC

- Base: `https://json.edhrec.com/pages/`
- **Unofficial** — no API key; use identifiable User-Agent; cache aggressively
- Key endpoints:
  - `/commanders/{slug}.json` — rank, salt, tag_counts, top cards, synergy
  - `/average-decks/{slug}.json` — full average decklist
  - `/cards/{slug}.json` — inclusion, top commanders
- `inclusion` field = **absolute deck count**, not % → normalize: `inclusion / commander.num_decks`
- **Global card popularity** (card page, top lists): EDHREC often omits `inclusion`; use **`num_decks / potential_decks`** for inclusion %
- Slug: precompute `card.edhrecSlug` — NFKD accent strip, apostrophes removed, DFC front face (`toEdhrecSlug`)

**Sync tiers:**

| Tier | Scope | Frequency |
|---|---|---|
| HOT | Top ~500 commanders by rank + similar expansion | Weekly |
| CATALOG | All `cards.is_commander` — commander JSON where EDHREC has a page | Before Phase 1.5 + monthly/manual |
| WARM | Viewed in last 30 days | On-demand, TTL 7d |
| COLD | Long-tail refresh | On-demand, TTL 30d |

Also weekly: top ~2000 card pages.

### MTGJSON (Phase 5)

- `DeckList.json` + individual deck files for precons
- Sync monthly + on new Commander product release

## Sync schedule

| Job | When | Script |
|---|---|---|
| Scryfall oracle_cards | Daily 03:00 UTC | `scripts/sync/scryfall-process.ts` (skips `art_series`) |
| Purge art_series + relink EDHREC | One-time / after bad import | `scripts/sync/purge-art-series.ts` |
| Scryfall sets metadata | Weekly Sunday | `scripts/sync/scryfall-sets.ts` |
| Scryfall set card index | Weekly Sunday (or `--codes=` on demand) | `scripts/sync/scryfall-set-cards.ts` |
| Scryfall oracle_tags | Weekly Sunday | `scripts/sync/scryfall-tags.ts` (`--if-changed`) |
| Card classifications | Weekly Sunday (after tags) | `scripts/sync/compute-card-classifications.ts` |
| EDHREC hot tier | Weekly Sunday | `scripts/sync/edhrec-commanders.ts`, `scripts/sync/edhrec-cards.ts` — **full profile/card page JSON** |
| EDHREC top lists | Weekly Sunday | `scripts/sync/edhrec-top-lists.ts` — browse index; **atomic** per `(entity, window)` replace (txn) |
| Purge expired page variants | Weekly Sunday (after top lists) | `scripts/sync/purge-edhrec-page-variants.ts` |
| EDHREC commander catalog sweep | Before 1.5; then monthly or manual | `scripts/sync/edhrec-commanders-catalog.ts` |
| Rankings recompute | Weekly | `scripts/sync/recompute-rankings.ts` (Phase 4) |
| MTGJSON precons | Monthly | `scripts/sync/mtgjson-precons.ts` (Phase 5) |

GitHub Actions (`.github/workflows/sync-*.yml`): **temporarily disabled** (`SYNC_JOBS_ENABLED: "false"`, cron commented out) until `DATABASE_URL` is set on GitHub and syncs are intentionally enabled — see `README.md` § GitHub Actions. When enabled: Scryfall daily/weekly sync; EDHREC weekly HOT + top lists + variant purge; commander catalog COLD fill (manual / optional monthly cron).

Daily Scryfall runs fetch bulk metadata only when `updated_at` matches the last successful sync (`sync_logs.errors.bulkUpdatedAt`); full download runs when Scryfall publishes a new bulk file.

**Runtime stale UX:**
- Detail: `StaleCacheBanner` when on-demand EDHREC refresh fails (dev-only hints after catalog UX decision).
- Browse (`/cards`, `/commanders`): `EdhrecSyncNotice` when `getEdhrecSyncHealth()` reports failure or staleness.
- Health watches SyncLog job types `commanders_hot`, `cards_hot`, and **`top_lists`**. Notice if any latest run failed, or any of those jobs has no success within **8 days**.

## SEO

- `NEXT_PUBLIC_SITE_URL` — canonical base for metadata, `/sitemap.xml`, `/robots.txt`
- `src/lib/seo/site.ts` — shared `createPageMetadata()` helper
- Dynamic `generateMetadata` on card/commander/set detail pages
- Sitemap includes static routes + cached EDHREC commanders/cards + all sets (revalidates daily)

## Application architecture

```
Browser
  └─ Analysis engine (client-side TS, Phase 2+) — lookup pre-computed card roles
Next.js App Router
  ├─ SSR pages: /cards/[slug], /commanders/[slug], /sets/[code], …
  ├─ Browse lists: RSC page loads first page via lib/browse → client island for filters / load-more
  ├─ API routes: /api/search, /api/cards/browse, /api/commanders/browse, /api/sets/search (pagination + filter changes)
  └─ Domain logic: src/lib/ (browse, edhrec, scryfall, …); src/services/ Phase 2+
PostgreSQL
  ├─ cards (+ roles/themes computed offline)
  ├─ edhrec_top_entries (browse ranked index — Phase 1.6)
  ├─ edhrec_commander_profiles (default commander meta + cardlists)
  ├─ edhrec_card_data (default card meta + cardlists)
  ├─ edhrec_page_variants (filtered detail payloads — Phase 1.6)
  ├─ decks, deck_publications, publication_ratings (Phase 2 / 4)
  └─ sync_logs
```

**Rule:** user-facing **browse/search** routes read Postgres only. On cache miss/expiry, `src/lib/edhrec/cache.ts` may fetch EDHREC once, upsert (WARM/COLD tier or variant row), then serve from DB. **Detail filter changes** (theme/budget/bracket) upsert **`edhrec_page_variants`**; never live EDHREC in browse.

## EDHREC cache layers (Phase 1.6)

Four complementary layers — **none deprecated**:

| Layer | Table(s) | Sync / fill | Primary consumers |
|---|---|---|---|
| **Top index** | `edhrec_top_entries` | `sync:edhrec-top-lists` weekly | `/cards` Most played, `/commanders` Top commanders, `window=` filter |
| **Default profiles** | `edhrec_commander_profiles`, `edhrec_card_data` | HOT weekly, catalog sweep, on-demand | Detail default view, All tab joins, global search, sitemap, salt/rank columns |
| **Filter variants** | `edhrec_page_variants` | On-demand on detail filter change | Commander + card detail with Theme/Budget/Bracket |
| **Scryfall catalog** | `cards`, `set_cards`, … | Scryfall sync | Oracle, images, prices, All tabs, legality |

**`sync_tier` (HOT/WARM/COLD)** on profile tables still drives TTL and weekly HOT refresh; browse primary tabs **no longer filter by tier** after 1.6.12.

**Top JSON URLs:** `https://json.edhrec.com/pages/top/{window}.json` and `pages/commanders/{window}.json` for `week|month|year`. Follow each list’s **`more`** pointer (e.g. `top/year-past2years-1.json`) until `more` is null — **not** `--N.json` (403). **`window=all`:** no top JSON. **Commanders** browse uses profile `rank`; **cards** browse has **no all-time window** (week/month/year only). Full sync can take hours (tens of thousands of card rows).

**Commander filter URLs (confirmed 2026-07-13, corrected 2026-07-13):** `pages/commanders/{slug}.json`; `…/{theme}.json`; `…/{budget|expensive}.json`; `…/{theme}/{budget|expensive}.json`; bracket slugs `exhibition|core|upgraded|optimized|cedh` (bracket **first** when combined). **`middle` / Mid budget is not available** — path `…/middle.json` returns 403 and `?cost=middle` returns unfiltered data; UI exposes Budget + Expensive only on commander detail. Stored in `edhrec_page_variants` on detail filter change (WARM TTL).

**Card filter URLs (confirmed 2026-07-13, removed from UI 2026-07-13):** `pages/cards/{slug}.json?cost=` and `?theme=` exist but **`?cost=` does not change** card JSON on tested staples; no card detail filter bar. Variant cache path retained for a future EDHREC theme list on card pages.

### Planned schema (1.6.10)

**`edhrec_top_entries`** — `entity_type`, `window`, `rank`, `slug`, `name`, `num_decks`, `inclusion`, `potential_decks`, `synced_at`; unique `(entity_type, window, slug)`.

**`edhrec_page_variants`** — `entity_type`, `slug`, nullable `theme`, `budget`, `bracket`, JSON payload (`cardlists`, stats), `synced_at`, `expires_at`; unique composite key.

## Discovery browse APIs (Phase 1.5)

Common list contract for `/api/cards/browse`, `/api/commanders/browse`, `/api/sets/search` (evolved), and `GET /api/search`:

```
Query:  limit, cursor, sort, order, + resource-specific filters
Response: { items: T[], total: number, nextCursor: string | null }
```

| Endpoint | Purpose |
|---|---|
| `GET /api/search?q=` | Unified navbar + `/search` (cards, commanders, sets; dedupe by slug) |
| `GET /api/cards/browse` | Tab `popular` \| `all` (`/catalog` UI); **`window=week\|month\|year` only** on top cards; sort/filter/paginate; `commanders_only` on `all` |
| `GET /api/commanders/browse` | Top commanders (`edhrec_top_entries` + profile join); `window=` filter |
| `GET /api/sets/search` | Cursor browse for sets (`items`, `total`, `nextCursor`; sort, filters) |

Legacy `GET /api/cards/search` and `GET /api/commanders/search` were removed (2026-07-16) — superseded by `/api/search`.

**Card detail printing context:** `/cards/{slug}?set={code}` — server reads `set_cards` for `(oracle_id, setCode)` to override hero `imageUri` before falling back to `cards.imageUri`.

**Detail routes:** `/cards/[slug]` loads catalog first; commander tab embeds EDHREC commander sections. `/commanders/[slug]` parallel; resolves catalog + `getCachedCommanderProfile`; soft fallback when profile missing.

## Folder structure

```
edhforge/
├── AGENTS.md                 ← agent entry point
├── docs/                     ← product + architecture docs (maintain these!)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   ├── sync/                 ← batch jobs (Scryfall, EDHREC, …)
│   ├── data/                 ← card-overrides.json
│   └── dev/                  ← db-health-snapshot, etc.
├── packages/
│   └── analysis/             ← pure TS engine (Phase 2+; not created yet)
├── src/
│   ├── app/                  ← Next.js routes + api/
│   ├── components/
│   │   ├── layout/           ← app shell, page shell, theme
│   │   ├── discovery/        ← browse/detail EDHREC UI
│   │   ├── mtg/              ← mana / rarity / salt icons
│   │   ├── ui/               ← shadcn primitives
│   │   └── dev/              ← catalog debug (gated)
│   ├── hooks/                ← client hooks (e.g. useBrowseList)
│   ├── lib/                  ← domain logic (+ colocated `*.test.ts`, Vitest)
│   │   ├── db.ts / db/       ← Prisma client + connection helpers
│   │   ├── browse/           ← browse query + param parsing
│   │   │   ├── cards.ts      ← facade: parse + queryCardsBrowse
│   │   │   ├── cards-filters.ts / cards-params.ts
│   │   │   ├── cards-popular.ts / cards-catalog.ts
│   │   │   └── commanders.ts · sets.ts · top-entries.ts · …
│   │   ├── edhrec/           ← client, cache, variants, parsers
│   │   ├── scryfall/         ← catalog filters, bulk client, prices
│   │   ├── classification/   ← roles/themes (batch / sync)
│   │   ├── search/           ← global search
│   │   ├── seo/ · ui/ · mtg/ · display/ · catalog/ · dev/
│   │   └── utils.ts          ← cn()
│   └── generated/prisma/     ← gitignored
└── .cursor/rules/            ← Cursor agent rules
```

Tests: `npm test` (Vitest). No DB required for current unit suite.

## Database schema (current + planned)

### Implemented (Phase 0)

- `cards` — Scryfall oracle card data
- `scryfall_oracle_tags` — Tagger tag metadata (slug, label)
- `card_oracle_taggings` — raw `(oracle_id, tag_id, weight)` for catalog cards
- `card_classifications` — derived `roles[]` + `themes[]` per oracle (override or oracle tag)
- `mtg_sets` — set metadata (code, name, release, type)
- `set_cards` — unique oracle cards per set (indexed offline via Scryfall search)
- `sync_logs` — job audit trail (indexes on `(source, job_type, started_at)` and `(source, job_type, status, completed_at)`)

### Phase 1

- `edhrec_commander_profiles` — default commander meta: rank/salt/decks + JSON cardlists/tag_counts (indexes: rank, num_decks, salt, expires_at, …)
- `edhrec_card_data` — default card meta: salt/inclusion/**potential_decks** + JSON cardlists (indexes: inclusion, num_decks, salt, expires_at, …)
- `edhrec_top_entries` — ranked browse index per time window (Phase 1.6)
- `edhrec_page_variants` — filtered detail payloads commander/card (Phase 1.6; index on `expires_at` for purge)

**Hot indexes (2026-07-16):** also `cards.cmc`, `cards.layout`. See migration `20260716010000_browse_sync_indexes`. GIN/trigram for color/type filters deferred.

### Phase 2

- `users`, `decks`, `deck_cards`

### Phase 4

- `deck_publications`, `publication_cards`, `publication_ratings`, `ranking_snapshots`

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
