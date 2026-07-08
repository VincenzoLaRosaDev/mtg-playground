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

Copy `.env.example` to `.env.local` and fill in Neon connection strings (pooled + direct):

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
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |

## Project phases

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full checklist.

- **Phase 0** (current): Scryfall catalog + card search
- **Phase 1**: EDHREC discovery (commander/card pages)
- **Phase 2**: Deck builder + import + auth
- **Phase 3**: Analysis + meta comparison
- **Phase 4**: Community (publish, vote, rankings)
- **Phase 5**: Polish, precons, launch

## Attribution

Card data from [Scryfall](https://scryfall.com). Not affiliated with Wizards of the Coast.
