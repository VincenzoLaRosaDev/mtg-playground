# EDHForge — Architecture

> Last updated: 2026-07-09

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

## Environment variables

```bash
DATABASE_URL=   # Neon pooled (-pooler host)
DIRECT_URL=     # Neon direct (migrations only)
NEXT_PUBLIC_SITE_URL=  # Production URL for SEO (optional locally)
AUTH_SECRET=    # Phase 2
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET=
AUTH_DISCORD_ID / AUTH_DISCORD_SECRET=
SYNC_CRON_SECRET=   # GitHub Actions → /api/sync/*
```

See `.env.example`.

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
- Slug: precompute `card.edhrecSlug` — NFKD accent strip, apostrophes removed, DFC front face (`toEdhrecSlug`)

**Sync tiers:**

| Tier | Scope | Frequency |
|---|---|---|
| HOT | Top ~500 commanders by rank + commanders with active user decks | Weekly |
| WARM | Viewed in last 30 days | On-demand, TTL 7d |
| COLD | Everything else | On-demand, TTL 30d |

Also weekly: top ~2000 card pages.

### MTGJSON (Phase 5)

- `DeckList.json` + individual deck files for precons
- Sync monthly + on new Commander product release

## Sync schedule

| Job | When | Script |
|---|---|---|
| Scryfall check + prices | Daily 03:00 UTC | `scripts/sync/scryfall-process.ts` |
| Scryfall sets metadata | Weekly Sunday | `scripts/sync/scryfall-sets.ts` |
| Scryfall set card index | Weekly Sunday (or `--codes=` on demand) | `scripts/sync/scryfall-set-cards.ts` |
| Scryfall full + tags | Weekly Sunday | same + `scryfall-tags.ts` (Phase 1) |
| EDHREC hot tier | Weekly Sunday | `scripts/sync/edhrec-commanders.ts` (Phase 1) |
| EDHREC card pages (hot) | Weekly Sunday | `scripts/sync/edhrec-cards.ts` (Phase 1) |
| Rankings recompute | Weekly | `scripts/sync/recompute-rankings.ts` (Phase 4) |
| MTGJSON precons | Monthly | `scripts/sync/mtgjson-precons.ts` (Phase 5) |

GitHub Actions: `.github/workflows/sync-edhrec.yml` (weekly EDHREC HOT sync; requires `DATABASE_URL` secret).

Runtime fallback: if EDHREC down → serve stale cache + show page-level stale banner; browse routes show sync notice when weekly sync failed or data is older than 8 days.

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
  ├─ SSR pages: /cards, /commanders, /sets, /publications
  ├─ API routes: /api/cards/search, /api/decks/*, ...
  └─ Services: src/lib/, src/services/ (Phase 2+)
PostgreSQL
  ├─ cards (+ roles/themes computed offline)
  ├─ edhrec_commander_profiles (cache)
  ├─ edhrec_card_data (cache)
  ├─ decks, deck_publications, publication_ratings
  └─ sync_logs
```

**Rule:** user-facing routes read Postgres only. On cache miss/expiry, `src/lib/edhrec/cache.ts` may fetch EDHREC once, upsert (WARM/COLD tier), then serve from DB. Never call EDHREC directly from page components.

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
│   └── data/
│       └── card-overrides.json
├── packages/
│   └── analysis/             ← pure TS engine (Phase 2+)
├── src/
│   ├── app/                  ← Next.js routes
│   ├── components/
│   │   ├── layout/           ← app shell, page shell
│   │   └── discovery/      ← card image, EDHREC sections, empty states
│   ├── lib/
│   │   ├── db.ts             ← Prisma client singleton
│   │   ├── scryfall/         ← types + card utils
│   │   └── edhrec/           ← EDHREC types, client, parsers
│   └── generated/prisma/     ← gitignored
└── .cursor/rules/            ← Cursor agent rules
```

## Database schema (current + planned)

### Implemented (Phase 0)

- `cards` — Scryfall oracle card data
- `mtg_sets` — set metadata (code, name, release, type)
- `set_cards` — unique oracle cards per set (indexed offline via Scryfall search)
- `sync_logs` — job audit trail

### Phase 1

- `edhrec_commander_profiles` — indexed rank/salt/decks + JSON cardlists/tag_counts
- `edhrec_card_data` — indexed salt/inclusion + JSON cardlists (top commanders)

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
computed roles[] + themes[] stored on Card (Phase 1: separate tables)
```

## Ranking algorithm (Phase 4)

- Bayesian average per axis (power, budget, originality)
- Min 3 votes in rolling 7-day window to appear in weekly rankings
- Separate leaderboards: global, per commander, per theme
- Display: `8.2 ★ (24 votes)` + brewer declared vs community for power

## Security notes

- Never commit `.env.local`
- `SYNC_CRON_SECRET` protects sync trigger endpoints
- Rate-limit public API routes in production (Phase 5)
