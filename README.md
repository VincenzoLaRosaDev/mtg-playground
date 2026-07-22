# MTGPlayground

Magic: The Gathering catalog, personal collection, and multi-format deck building — Scryfall-backed, printing-first.

> Package/UI brand is **MTGPlayground** (`package.json` name `mtgplayground`). Local folder and GitHub repo may still be `edhforge` until ops rename.

## Documentation

| Doc | Purpose |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Start here** (AI agents + contributors) |
| [`docs/PROJECT.md`](docs/PROJECT.md) | Product spec — MTGPlayground pivot |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data sources, sync |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase checklist + status |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log |

## Stack

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL** on [Neon](https://neon.tech)
- **Prisma** ORM
- **Scryfall** bulk data (oracle + printings)

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

**Auth (Phase 2.1):** set `AUTH_SECRET` (`openssl rand -base64 32`). Configure any of Google / Discord OAuth and/or Resend (`AUTH_RESEND_KEY`, `AUTH_RESEND_FROM`) — providers without credentials are skipped. Without Resend, magic-link sign-in stays disabled.

### 3. Database migration

```bash
npm run db:migrate
```

### 4. Sync Scryfall catalog

```bash
npm run sync:scryfall
```

Downloads Scryfall oracle bulk and upserts cards. Takes a few minutes. Follow with sets + printings + tags + classifications when needed:

```bash
npm run sync:scryfall-sets
npm run sync:scryfall-printings
npm run sync:scryfall-tags
npm run sync:compute-classifications
```

`sync:scryfall-printings` downloads Scryfall **`default_cards`** bulk (larger than oracle; often tens of minutes on first run) and upserts the `printings` table.
### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — try **Browse** at `/browse`, **Collection** at `/collection` (sign-in required).

## Scripts

See `package.json` for sync and DB scripts. Browse API: `GET /api/browse`. Auth: `GET/POST /api/auth/*` (Auth.js).

## Project phases

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

- **Phase 0–1.8** ✅ Catalog foundation (historical EDHForge path)
- **Phase 2.0** ✅ MTGPlayground pivot (printings, unified detail)
- **Phase 2.1** ✅ Auth + printing-level collection
- **Phase 2.2** ⬜ Multi-format decks · **2.3** Precons — **current**
- **Phase 3–5** Analysis, community, launch

## Attribution

Card data from [Scryfall](https://scryfall.com). Not affiliated with Wizards of the Coast.
