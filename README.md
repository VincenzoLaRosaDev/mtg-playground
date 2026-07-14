# EDHForge

Commander deck analyzer and community — analyze decks, compare against EDHREC meta, publish and rate brews.

## Documentation

| Doc | Purpose |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Start here** (AI agents + contributors) |
| [`docs/PROJECT.md`](docs/PROJECT.md) | Product spec, features, entities |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data sources, sync |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase checklist + status |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log |

## Stack

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL** on [Neon](https://neon.tech)
- **Prisma** ORM
- **Scryfall** bulk data (card catalog)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in Neon connection strings (pooled + direct). For production SEO, set `NEXT_PUBLIC_SITE_URL` to your public URL.

```bash
cp .env.example .env.local
```

### 3. Database migration

```bash
npm run db:migrate
```

### 4. Sync Scryfall card catalog

```bash
npm run sync:scryfall
```

Downloads ~170 MB from Scryfall and upserts all oracle cards. Takes a few minutes.

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — try **Search cards** at `/cards`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run sync:scryfall` | Full Scryfall oracle_cards sync |
| | Add `--if-changed` to skip download when bulk `updated_at` is unchanged (used by GitHub Actions daily) |
| `npm run sync:scryfall-sets` | Sync Magic set metadata from Scryfall |
| `npm run sync:scryfall-set-cards` | Index set membership (`--limit=`, `--codes=`) |
| `npm run sync:scryfall-tags` | Sync Scryfall oracle_tags bulk (`--if-changed`) |
| `npm run sync:compute-classifications` | Recompute `card_classifications` from overrides + taggings |
| `npm run sync:build-card-overrides` | Regenerate `scripts/data/card-overrides.json` from staple list + DB |
| `GET /api/cards/browse` | Cards browse (tabs, sort, filters, cursor pagination) |
| `GET /api/commanders/browse` | Top commanders browse (sort, filters, `window=`, cursor pagination) |
| `GET /api/search` | Unified search (cards, commanders, sets; dedupe commander/card by slug) |
| `npm run sync:edhrec-commanders` | Sync top EDHREC commander profiles (default: 500, HOT tier) |
| `npm run sync:edhrec-commanders-catalog` | Fill missing catalog commander profiles (COLD tier; `--batch-size=`, `--offset=`, `--all`) |
| `npm run sync:edhrec-cards` | Sync top EDHREC card pages (default: 2000) |
| `npm run sync:edhrec-top-lists` | Sync EDHREC top browse index (`edhrec_top_entries`; **full** `list.more` chain for week/month/year). Optional: `--windows=year`, `--max-entries=N`. Skips `all` (no JSON). Can take hours. |
| `npm run sync:backfill-edhrec-slugs` | Recompute `edhrec_slug` on all cards after slug rule changes |
| `npm run sync:purge-art-series` | Remove `art_series` rows and relink EDHREC `cardId` |
| `npm run sync:purge-edhrec-page-variants` | Delete expired `edhrec_page_variants` rows |
| `npx tsx scripts/dev/db-health-snapshot.ts` | Dev: row counts + table sizes (requires `DATABASE_URL`) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |

## GitHub Actions

> **Currently disabled** — sync workflows ship with `SYNC_JOBS_ENABLED: "false"` and cron triggers commented out until GitHub is configured.

**To enable after setup:**

1. Add repository secret **`DATABASE_URL`** (Neon pooled URL).
2. In each workflow under `.github/workflows/`, set `SYNC_JOBS_ENABLED: "true"`.
3. Uncomment the `schedule:` block in each workflow (cron timings below).
4. Push, then use **Actions → Run workflow** to verify before relying on cron.

| Workflow | Schedule (when enabled) | What it runs |
|---|---|---|
| `.github/workflows/sync-scryfall.yml` | Daily 03:00 UTC | `sync:scryfall --if-changed` (skips download when bulk unchanged) |
| | Sundays 04:30 UTC | `sync:scryfall-sets` + `sync:scryfall-set-cards` + `sync:scryfall-tags --if-changed` + `sync:compute-classifications` |
| `.github/workflows/sync-edhrec.yml` | Sundays 04:00 UTC | HOT commanders + cards + **full top lists** (6h timeout) |
| `.github/workflows/sync-edhrec-catalog.yml` | Manual / optional monthly cron | Commander catalog COLD fill |

All workflows support **workflow_dispatch** for manual runs (also gated by `SYNC_JOBS_ENABLED`). Scryfall dispatch options: `if-changed`, `full`, `sets-only`.

## Project phases

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full checklist.

- **Phase 0** ✅ Scryfall catalog + card search
- **Phase 1** ✅ EDHREC discovery (commanders, cards, sets)
- **Phase 2**: Deck builder + import + auth
- **Phase 3**: Analysis + meta comparison
- **Phase 4**: Community (publish, vote, rankings)
- **Phase 5**: Polish, precons, launch

## Attribution

Card data from [Scryfall](https://scryfall.com). Not affiliated with Wizards of the Coast.
