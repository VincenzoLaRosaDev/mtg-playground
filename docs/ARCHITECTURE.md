# MTGPlayground — Architecture

> Last updated: 2026-07-26 · Product pivot from EDHForge; package/UI = MTGPlayground; `printings` via default_cards

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL on Neon (free tier, Europe Central) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Auth.js v5 — Google + Discord + Resend magic link; Prisma Adapter; JWT sessions; primary UX = `SignInSheet`; `/signin` bridges to the sheet (Auth.js `pages.signIn`) |
| Styling | Tailwind CSS 4 |
| Charts | CSS/SVG bars in deck-builder analysis (Phase 3); Recharts deferred |
| Jobs | Node scripts + GitHub Actions cron |
| Hosting | Vercel (app) + Neon (DB) |

## Environments (Git × Vercel × Neon × Google)

| Role | Git | Vercel | Neon branch | Google OAuth client | App env file / vars |
|---|---|---|---|---|---|
| **Local** | Any working branch (often `dev`) | — | **`dev`** | Local client | `.env.local` → Neon `dev` URLs + local Google credentials |
| **Staging (online)** | Branch **`dev`** | **Preview** (tracks `dev`) | **`Staging`** | Staging client | Vercel Preview env vars → Neon Staging + staging Google |
| **Production** | **`main`** | **Production** | **`production`** | Prod client | Vercel Production env vars → Neon production + prod Google |

Notes:

- Vercel “Preview” **is** our online staging surface (not a separate Vercel Environment named Staging).
- Neon branch names are case-sensitive in the console (`dev` / `Staging` / `production`) — connection strings in each env must match that branch’s endpoints.
- Discord / Resend (if enabled) should follow the same split when credentials differ; Google is the required three-way split today.
- GitHub Actions sync (when enabled) should target **production** Neon via repository `DATABASE_URL` secret — never the local `dev` branch by accident.

### Prisma migrations per environment

| Command | Use when |
|---|---|
| `npm run db:migrate:deploy` (`prisma migrate deploy`) | **Default** against Neon branches (local `dev`, Staging, production). Applies pending SQL only; never resets. |
| `npm run db:migrate` (`prisma migrate dev`) | Only on a **disposable** database. Can prompt for reset if migration history drifts. |

Do **not** run `migrate reset` on Neon `Staging` / `production`. On Neon `dev`, reset is allowed only if you accept losing local user/collection data and re-syncing the catalog.

If `migrate dev` claims a migration was “modified after it was applied”, check `_prisma_migrations` for a **rolled-back / unfinished** duplicate row (`finished_at IS NULL`) before resetting — delete the orphan row, then `db:migrate:deploy`.

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
DATABASE_URL=   # Neon pooled (-pooler host) for this env’s Neon branch; ?sslmode=verify-full
DIRECT_URL=     # Neon direct (migrations only) for the same branch; ?sslmode=verify-full
NEXT_PUBLIC_SITE_URL=  # Canonical public URL (prod / staging Preview URL)
AUTH_SECRET=    # Phase 2 — distinct per env recommended
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET=  # Client matching this env (local / staging / prod)
AUTH_DISCORD_ID / AUTH_DISCORD_SECRET=
```

Local `.env.local` must use the Neon **`dev`** branch endpoints + the **local** Google client (redirect `http://localhost:3000/api/auth/callback/google`). Vercel Preview/Production override these via the dashboard.

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
- **Popularity / Inclusion:** `edhrec_rank` = Commander **inclusion** rank only — UI label **EDH Inclusion**; never “as commander” popularity. Commanders browse is name-first; EDH Inclusion still shown on tiles with honest copy.

### MTGJSON (Phase 2.3)

- `DeckList.json.gz` + per-deck `api/v5/decks/{fileName}.json`
- Sync: `scripts/sync/mtgjson-precons.ts` (`npm run sync:mtgjson-precons`) — constructed-type allowlist, format map, printing resolve via Scryfall ids / set+cn
- Tables: `precons`, `precon_cards`; optional `decks.source_precon_id` on fork
- Cadence: monthly + `--if-changed` (meta.date); run after Scryfall printings are indexed

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
| MTGJSON precons | Monthly 1st 05:00 UTC (`--if-changed`) + manual | `scripts/sync/mtgjson-precons.ts` |

GitHub Actions:
- `.github/workflows/sync-scryfall.yml` — daily `oracle_cards` (`0 3 * * *` UTC) and weekly sets/printings/tags/classifications (`30 4 * * 0` UTC); `workflow_dispatch` modes `if-changed` / `full` / `sets-only`.
- `.github/workflows/sync-mtgjson-precons.yml` — monthly constructed precons (`0 5 1 * *` UTC) with `--if-changed`; `workflow_dispatch` `if-changed` / `full`.

Both are **cron + `workflow_dispatch` only** (never on push). Require repository secret `DATABASE_URL` → Neon **production** pooled URL. Pause schedules by commenting out the `schedule` block. Note: job-level `if:` cannot use the `env` context — gate with `github.event_*` only.

Daily Scryfall runs fetch bulk metadata only when `updated_at` matches the last successful sync (`sync_logs.errors.bulkUpdatedAt`); full download runs when Scryfall publishes a new bulk file.

**Sync write path (Wave C):** oracle cards and printings upsert in batches of ~200 via parameterized `INSERT … ON CONFLICT` (`$executeRaw`) — cards conflict on `oracle_id` (keep existing `id`); printings conflict on `id`.

## SEO

- `NEXT_PUBLIC_SITE_URL` — canonical base for metadata, `/sitemap.xml`, `/robots.txt`
- `src/lib/seo/site.ts` — shared `createPageMetadata()` helper
- Dynamic `generateMetadata` on card/set detail pages (`/commanders/[slug]` redirects)
- Sitemap: static routes (incl. `/precons`) + playable `cards` rows (`cards.slug`) for `/cards/{slug}` (capped) + all sets (revalidates daily)

## Application architecture

```
Browser
  └─ Analysis engine (client-side TS, Phase 2+) — lookup pre-computed card roles
Next.js App Router
  ├─ SSR pages: /browse, /cards/[slug], /sets/[code], /precons, /collection, /decks, … (/commanders/[slug] → redirect)
  ├─ Browse lists: RSC page loads first page via lib/browse → client island for filters / load-more
  ├─ API routes: /api/search, /api/browse, /api/sets/search, /api/precons/search (pagination + filter changes)
  └─ Domain logic: src/lib/ (browse, discovery, scryfall, classification, decks, collection, precons, …)
PostgreSQL
  ├─ cards (+ popularity/GC; roles/themes in card_classifications; slug via toCardSlug)
  ├─ printings / mtg_sets
  ├─ collection_items, decks, deck_cards
  ├─ deck_publications, publication_ratings (Phase 4)
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
| `GET /api/browse` | Unified hub browse; default EDH Inclusion sort; `commanders_only=true` (or legacy `entity=commanders`) → `isCommander` + Name sort default; `format=` → `legalities[format] === "legal"` |
| `GET /api/cards/browse` | Legacy catalog browse (same query stack; optional `commanders_only` / `format`) |
| `GET /api/commanders/browse` | Legacy commanders wrapper (`is_commander` + require slug) |
| `GET /api/search?q=` | Unified navbar + `/search` (cards + sets; cards via weighted FTS on name/type/oracle; legal commanders flagged) |
| `GET /api/sets/search` | Cursor browse for sets |

**Browse facets (v1):** color identity, CMC min/max, type contains, Role, Theme, **Format** (curated Scryfall keys via `src/lib/formats/scryfall-formats.ts`; JSONB path equals `legal`; legacy `commander=legal` → `format=commander`), Game Changer, Reserved, **Commander** (`isCommander` via `commanders_only`), rarity. No **price band** filter — oracle catalog prices are for one Scryfall representative printing, not min/max across versions. **Role/Theme selects** are hide-empty against `card_classifications` (closed enums in `FUNCTIONAL_ROLES` / `SYNERGY_THEMES`; fall back to full enum if classifications are empty). **Sort:** `popularity` (**EDH Inclusion** — default when Format is Any or Commander), `color` (Color & CMC via denormalized `color_sort` — default for other formats), name, cmc, price (EUR-first, representative printing). Options Commander (`commanders_only`) defaults sort to Name.

**Sets browse:** set-type select options come from `DISTINCT mtg_sets.set_type` (`listDistinctSetTypes`), not a hardcoded subset.

**Card enrichment columns:** `popularity_rank` (Scryfall `edhrec_rank`), `color_sort` (Arena/Scryfall color order key from `colors[]`; set at sync + migration backfill), `search_document` (oracle + face text corpus), `search_tsv` (DB-generated weighted tsvector), `is_game_changer`, `is_reserved`, `mana_cost`, `power`/`toughness`/`loyalty`.

**Card text search:** browse `q` and `GET /api/search` share FTS on `search_tsv` via `to_tsquery`. **Hybrid:** tokens joined with `<->` (phrase adjacency); **last token always gets `:*` prefix** so partial typing works (`destroy all creatu`, `day of judgmen`). Single-token queries are `token:*`. Not fuzzy for typos in the middle of a word. Type contains remains a separate AND filter. Apostrophes are stripped on both query sanitize and the generated `search_tsv` (so `Y'shtola` / `Yshtola` match).


**SSR default hydrate cache:** `/browse` first paint uses `unstable_cache` (`src/lib/browse/browse-cache.ts`, tag `browse-hub`, revalidate 1h). Filtered/cursor API requests are uncached.

Legacy `GET /api/cards/search` and `GET /api/commanders/search` were removed (2026-07-16) — superseded by `/api/search`.

**Card detail printing context:** `/cards/{slug}?set={code}&cn={collector}&finish={foil|etched}` — `resolveCardPrinting` / `listOraclePrintings` in `src/lib/scryfall/card-printing.ts`. No `set` → catalog default printing (`cards.id` === `printings.id`, else `image_uri` match) with set/cn/finishes filled for the VersionPicker. `set` only → lowest `collector_number` in that set. `set`+`cn` → exact printing. `finish` (omit = nonfoil) drives price chip preference and a CSS foil/etched sheen on the hero (Scryfall art is shared across finishes). VersionPicker lists real printings only (no “Catalog default” row). Set detail and commander redirects preserve version params via `buildCardVersionHref`.

**Detail route:** `/cards/[slug]` is the sole **catalog** oracle hub (`findPlayableCardBySlug`). **Overview band:** EDH Inclusion / Legal commander / GC / Reserved + **staggered multiface** (`priority` hero) + VersionPicker / prices (+ Show all versions sheet). SSR awaits hero in parallel: active printing (`resolveOraclePrintingOption`), `printingCount`, classification, collection summary (via `auth()`); lists stream via `CardDetailListsDeferred` (`Suspense` + `fallback={null}`). Full `listOraclePrintings` loads client-side via `loadOraclePrintings` when Show all versions / Version select needs them — sheets open only after data is ready (no skeleton). **Card detail modal:** callers pass tile `imageUri`/`faces`; client `preloadImage` warms Scryfall while `loadCardDetailModal` runs (catalog hero only); after open, `loadCardDetailModalUserData` fills collection ∥ deck. **Header:** **Go to set** for the active printing (`/sets/{code}`), under the title on mobile and right-aligned on `sm+`. **Lists band:** As card (similar + relatives) by default; when `isCommander`, **As card | As commander** toggle via `?view=commander` switches to D2 pack (role staples / GC in CI / build skeleton) with sticky TOC. `/commanders/[slug]` permanentRedirects here (preserves `set`/`cn`/`finish`).

**Workspace overlays / card modal (Phase 2.2+):** In-app card opens use **`CardDetailModal`** (`CardDetailModalProvider` / `useCardDetailModal`) — hero + Status|Roles|Themes + shared **Printing** chrome (`VersionPicker`: Version select + Show all versions, then Finish) via nested **`VersionsBrowser`** + CTAs + **View detail** to the PDP. `loadCardDetailModal` seeds a single active printing via `resolveOraclePrintingOption` (+ `printingCount`) with no auth; after the sheet opens, `loadCardDetailModalUserData` loads collection + optional deck snapshots (`listOracleCollectionSummary` ∥ `listOracleDeckSnapshot`). `loadOraclePrintings` loads the full list when Show all versions opens or Version select is used (sheet opens only after data). Selection updates the modal preview (no navigation). Deck mode shows **In this deck**; collection mode shows **Your copies**. On collection/deck workspace pages, successful adds close the modal. Search overlays (`WorkspaceSearchOverlay` / collection-add search) pick a card then open that modal. The public PDP at `/cards/[slug]` keeps the same Printing chrome (navigate on version change), collection panel, and As card / As commander lists (SEO/share). Tile `href` remains for middle-click / open-in-new-tab. See `docs/DECISIONS.md` (2026-07-28 / 2026-07-29). D2 helpers remain available for deck-builder insights (Phase 2.2.6).

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
│   └── (none for analysis — deck analysis lives under src/lib/decks/)
├── src/
│   ├── app/                  ← Next.js routes + api/
│   ├── components/
│   │   ├── layout/           ← app shell, page shell, theme
│   │   ├── discovery/        ← browse/detail catalog UI
│   │   ├── decks/            ← editor, insights/analysis panel, legality
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
│   │   ├── decks/            ← CRUD, legality, insights, composition, coherence
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

- `cards` — Scryfall oracle card data; `slug` (`toCardSlug`) for routes; enrichment: `popularity_rank`, `is_game_changer`, `is_reserved`, `mana_cost`, `power`/`toughness`/`loyalty`, **`faces` Json** (multiface); denorm **`list_price_eur`** (browse price sort) + **`min_rarity` / `min_rarity_rank`** (oracle lowest printing tier, refreshed at printings sync)
- `scryfall_oracle_tags` — Tagger tag metadata (slug, label)
- `card_oracle_taggings` — raw `(oracle_id, tag_id, weight)` for catalog cards; unique `(oracle_id, tag_id)` covers oracle lookups (no separate `oracle_id`-only index)
- `card_classifications` — derived `roles[]` + `themes[]` per oracle (override or oracle tag); GIN on `roles` / `themes`
- `mtg_sets` — set metadata (code, name, release, type)
- `printings` — one Scryfall printing per row (set + collector #; finishes, faces, prices); soft-join via `oracle_id`; index `(oracle_id, released_at DESC)`
- `sync_logs` — job audit trail (indexes on `(source, job_type, started_at)` and `(source, job_type, status, completed_at)`)

**Auth + collection (Phase 2.1):**
- `users`, `accounts`, `sessions`, `verification_tokens` — Auth.js (NextAuth v5) + Prisma Adapter; app sessions are **JWT** (edge-safe `auth.config`) while users/accounts persist in Postgres
- Sign-in UX: in-page sheet (`SignInSheetProvider` / `useSignInSheet`); nav **Collection** uses `RequireAuthLink` when signed out; `/collection` shows `CollectionSignInGate` (no middleware redirect). `/signin` is Auth.js `pages.signIn` only and bridges to the sheet
- Sign-out from `/collection` or `/decks/*` redirects to `/` (`signOut({ callbackUrl: "/" })`) so the page-level SignInGate does not reopen the sheet on an empty workspace; other routes keep the current URL
- `collection_items` — `(user_id, printing_id, finish, wantlist)` unique; owned and wish are separate rows; `quantity` ≥ 1 per row; FK to `users` + `printings`
- `/collection` query: paginated (`cursor` / page size 48); scope `filter` (`all` / owned / wish), sort `sort`/`order`, facets scoped to the user’s inventory oracles (not full-catalog scans)

**Removed (Phase 1.7):** `edhrec_commander_profiles`, `edhrec_card_data`, `edhrec_top_entries`, `edhrec_page_variants`; column rename `edhrec_slug` → `slug`.

**Removed (Phase 2.0.5):** `set_cards` (replaced by `printings`).

**Card relations (2026-07-31):** `card_relations` + `CardRelationComponent` (`token` | `extra`) from Scryfall `all_parts` — deck/precon **Tokens & Extras** inference only (not Related parts on the card PDP). Resolve related oracle, then **denylist playable main-deck cards** (Alchemy/conjure/meld partners); classify remainder via `relation-classify.ts` (`Token` type → Tokens; emblems, City's Blessing-style `Card` markers, dungeons, … → Extras). Related ids: `Card.id` → `Printing.id` → name. Token **sets** are ingested; memorabilia still skipped. Browse/FTS exclude layouts `token` / `double_faced_token` / `emblem` / `art_series`.

**Hot indexes:** `cards.cmc`, `cards.layout`, `cards.popularity_rank`, `cards.is_game_changer`, `cards.is_reserved`, `cards.color_sort`, `cards.list_price_eur`, `cards.min_rarity_rank`. **FTS:** `cards.search_tsv` GIN. **GIN arrays:** `cards.color_identity`, `card_classifications.roles` / `themes`.

### Neon cost hygiene (2026-07-22)

Compute hours dominate over storage (~236 MB catalog). Mitigations: bounded FTS id lists for browse `q`; denorm price/rarity; collapsed commander detail-pack queries; collection pagination + user-scoped facets; sync bulk `INSERT … ON CONFLICT` (oracle + printings); script Prisma pool `max: 5`.

### Decks (Phase 2.2)

- `decks` — private workspace: `user_id`, `name`, `format` (Scryfall browse key), optional `notes`; limits: 50 decks / user
- `deck_cards` — oracle-grain list: `(deck_id, oracle_id, board)` unique; `board` ∈ `main` \| `side` \| `commander` \| `companion`; `quantity` ≥ 1; optional `preferred_printing_id` → `printings` (ON DELETE SET NULL); soft-join `cards` via `oracle_id`
- Routes: `/decks`, `/decks/[id]` (auth; middleware + page `auth()`); nav **Decks**. Create is a sheet on `/decks` (legacy `/decks/new` redirects). `/decks` list cards load cover face + cost pip segments via enriched `listDecks` (`pickDeckCover` + `summarizeDeckManaPips`).
- Deck/precon stats: shared `buildDeckStatsFromCards` (`src/lib/decks/build-deck-stats.ts`) feeds `DeckInsightsPanel` on the deck editor and `/precons/[slug]`.
- Precon browse: `listPrecons` search widens to set name + commander; filters type + denormalized `Precon.colorIdentity` (filled by `sync:mtgjson-precons` / `recomputeAllPreconColorIdentities`).
- Editor presentation: `CardFaceTile` grid (`CARD_FACE_GRID_CLASS`); Main/Side grouped by primary type (`src/lib/decks/card-type-groups.ts`); detail sort board → type → CMC → name
- Owned/missing: batch `SUM(collection_items.quantity)` where `!wantlist` grouped by `printing.oracle_id` (`src/lib/decks/owned.ts`)
- Legality (`src/lib/decks/legality.ts`): Scryfall status + format rules (size / copies / CI / commander); mutations block illegal adds; editor panel lists issues
- Hard cap 250 card copies per deck across boards
- Import (`src/lib/decks/paste-parse.ts` + `paste-resolve.ts` + `importDeckPaste`): Arena + plain-text paste → oracle rows (set/CN ignored; no preferred printing); **replace** semantics (clears existing deck cards first); sections Deck / Sideboard / Commander / Companion; Arena `About` / `Name …` skipped (name captured); plain lists without headers use a blank line to open sideboard; resolve matches front-face + DFC `name // back` and case-insensitive `name` (covers stale apostrophe `search_name`)
- Qty inputs (editor + modal deck CTAs) capped by `maxCopiesForCard` (constructed 4 / commander-like 1 / restricted 1 / basics 99)
- Insights / deck stats (`src/lib/decks/insights.ts`, `composition.ts`, `curve-breakdowns.ts`, `quantity-breakdowns.ts`, `odds-rows.ts`, `coherence.ts`, `est-cost.ts`, `mana-pips.ts`, `mana-production.ts`, `hypergeometric.ts`; UI `DeckColorsStats`, `DeckCurveStats`, `DeckQuantitiesStats`, `DeckOddsStats` + `mana-palette`): Archidekt-inspired block **below** the deck list — header Size/Avg MV/Est cost/Lands; Overview (dashboard snapshot) first on its own row (full width → `2xl:max-w-[50%]`); then column mosaic at `lg+` (left Colors→Quantities, right Mana curve→Odds, natural heights; stack below `lg` keeps Colors → Curve → Quantities → Odds); Odds table scroll-capped. Soft coherence advisories. Commander-like formats also show build-skeleton progress vs `BUILD_SKELETON_TARGETS`. No salt/bracket/EDHREC; no `/decks/[id]/analysis` route.
- **Tokens & Extras** (`src/lib/decks/tokens-extras.ts`, UI `DeckTokensExtrasSection`): after stats on editor + precon PDP; **read-only**, stacked Tokens then Extras; own `DeckViewToggle` List/Grid (`mtgplayground.deckTokensExtrasView` / `preconTokensExtrasView`) — independent of the main deck/precon list. Inferred from main+commander relations (precon also merges MTGJSON `PreconCard.board=token` into Tokens). Deck boards: `main | side | commander | companion`.

### Planned (Phase 4)

- `deck_publications`, `publication_ratings`, ranking snapshots

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
