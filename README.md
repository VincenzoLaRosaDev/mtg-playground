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

Against Neon (including local Neon branch **`dev`**), apply pending migrations with:

```bash
npm run db:migrate:deploy
```

Use `npm run db:migrate` (`prisma migrate dev`) only on a disposable database — it may prompt for a full reset if migration history drifts. Environment map (Git × Vercel × Neon × Google): [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) § Environments.

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

After printings are indexed, load official constructed precons (MTGJSON):

```bash
npm run sync:mtgjson-precons
# optional: --if-changed   # skip deck fetch when DeckList meta.date unchanged
#                          # (still recomputes Precon.colorIdentity for browse filters)
# optional: --limit 20     # smoke test
```

After adding the `color_identity` column, apply migrations then run sync (or `--if-changed`) so browse color pills have data.

CI: `.github/workflows/sync-mtgjson-precons.yml` runs monthly (1st 05:00 UTC, `--if-changed`) and via Actions **workflow_dispatch** (`if-changed` / `full`) against the `DATABASE_URL` secret (production Neon).

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — try **Browse** at `/browse`, **Precons** at `/precons`, **Collection** at `/collection`, **Decks** at `/decks` (sign-in required for the last two).

**Phone on LAN:** open `http://<your-lan-ip>:3000`. Next 16 blocks cross-origin dev assets by default — add the host to `allowedDevOrigins` in `next.config.ts` (the blocked IP is printed in the terminal) and restart `npm run dev`, or clicks/HMR will appear broken on the device.

**Auth on phone:** Google (and most OAuth consoles) **reject private IPs** like `192.168.x.x` as redirect URIs — only `http://localhost:…` and public domains are allowed. Options:

1. Test Google/Discord OAuth on the Mac at `http://localhost:3000` (already registered).
2. For real-device OAuth, expose the app with a public tunnel and register that HTTPS origin, e.g. `cloudflared tunnel --url http://localhost:3000`, then set `AUTH_URL` to the tunnel URL and add `https://<tunnel>/api/auth/callback/google` in Google Cloud + the tunnel host to `allowedDevOrigins`.
3. UI/layout checks on the phone via LAN IP still work without completing OAuth on-device.

## Scripts

See `package.json` for sync and DB scripts. Browse API: `GET /api/browse`. Auth: `GET/POST /api/auth/*` (Auth.js).

## Project phases

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

- **Phase 0–1.8** ✅ Catalog foundation (historical EDHForge path)
- **Phase 2.0** ✅ MTGPlayground pivot (printings, unified detail)
- **Phase 2.1** ✅ Auth + printing-level collection
- **Phase 2.2** ✅ Multi-format deck builder
- **Phase 2.3** ✅ Precons (MTGJSON)
- **Phase 3** ✅ Analysis (in-builder)
- **Phase 4** ⬜ Community (multi-format)
- **Phase 5** Polish & launch

## Attribution

Card data from [Scryfall](https://scryfall.com). Not affiliated with Wizards of the Coast.
