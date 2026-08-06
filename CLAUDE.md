@AGENTS.md

# Claude Code — operational notes

`AGENTS.md` above is the source of truth for product/architecture/decisions and is shared with other tools (Cursor rules in `.cursor/rules/` mirror it). This section adds Claude Code–specific workflow only — do not duplicate product facts here.

## Before reporting a task done

- `npm run lint` and `npm test` (Vitest, no DB required) — both must pass for files you touched
- For any UI change: `npm run dev` and check the affected route in a browser (mobile viewport too if it touches nav/sheets/filters — this repo has a lot of responsive drawer/sheet chrome)
- If you touched `prisma/schema.prisma`: remind the user a migration is needed — against Neon use `npm run db:migrate:deploy` (not `migrate dev` / reset); never run migrations without explicit confirmation. Env map: `docs/ARCHITECTURE.md` § Environments
- If you touched sync scripts (`scripts/sync/*`): do not run them speculatively — they hit live Scryfall bulk endpoints and can take minutes

## Known baseline state (verify before trusting — this drifts)

- `npm run lint` and `npm test` are clean (0 errors, 150+ passing) as of 2026-08-05. The former 15 pre-existing `react-hooks/refs` / `react-hooks/set-state-in-effect` errors were fixed 2026-07-24 (see `docs/DECISIONS.md`).
- `.github/workflows/ci.yml` runs lint → test → build on push/PR to `main` (no DB secret needed — all routes are `force-dynamic`). `.github/workflows/sync-scryfall.yml` (daily/weekly) and `.github/workflows/sync-mtgjson-precons.yml` (monthly) are active cron jobs, not disabled.
- `npm audit` is clean (0 vulnerabilities) as of 2026-08-05. `npm outdated` still shows minor bumps available (Prisma, Next patch, React, ESLint 10) — none urgent; re-check before assuming this is current.

## Working in this repo

- Prisma client is generated to `src/generated/prisma/` (gitignored) — run `npm run db:generate` after pulling schema changes if types look stale
- All `PrismaClient` construction must pass the `@prisma/adapter-pg` adapter (`src/lib/db.ts`); scripts use `createScriptPrismaClient()` (capped pool) not the app singleton
- Auth/collection code already scopes every query/mutation to the session `userId` (see `src/lib/collection/actions.ts`) — preserve that pattern for any new user-owned data (decks, Phase 2.2)
