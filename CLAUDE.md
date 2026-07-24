@AGENTS.md

# Claude Code — operational notes

`AGENTS.md` above is the source of truth for product/architecture/decisions and is shared with other tools (Cursor rules in `.cursor/rules/` mirror it). This section adds Claude Code–specific workflow only — do not duplicate product facts here.

## Before reporting a task done

- `npm run lint` and `npm test` (Vitest, no DB required) — both must pass for files you touched
- For any UI change: `npm run dev` and check the affected route in a browser (mobile viewport too if it touches nav/sheets/filters — this repo has a lot of responsive drawer/sheet chrome)
- If you touched `prisma/schema.prisma`: remind the user a migration is needed (`npm run db:migrate`); never run migrations against a real `DATABASE_URL` without explicit confirmation
- If you touched sync scripts (`scripts/sync/*`): do not run them speculatively — they hit live Scryfall bulk endpoints and can take minutes

## Known baseline state (verify before trusting — this drifts)

- `npm run lint` currently fails with **15 pre-existing errors** unrelated to typical feature work: `react-hooks/refs` in `src/hooks/use-browse-list.ts` (ref mutation during render — an intentional lazy-ref pattern the newer eslint-plugin-react-hooks flags) and `react-hooks/set-state-in-effect` in `src/hooks/use-active-detail-section-id.ts`. Don't assume you introduced these; don't silently "fix" them as a drive-by unless asked.
- No CI workflow lints/tests/builds on push or PR — only `.github/workflows/sync-scryfall.yml` (data sync, currently disabled via `SYNC_JOBS_ENABLED: "false"`) exists. Nothing gates broken code from landing on `main` except this session.
- `npm outdated` shows `next` one patch behind (16.2.10 → 16.2.11), which resolves 4 high-severity `npm audit` advisories (bundled `postcss`/`sharp`). Low-risk patch bump if asked to address it.

## Working in this repo

- Prisma client is generated to `src/generated/prisma/` (gitignored) — run `npm run db:generate` after pulling schema changes if types look stale
- All `PrismaClient` construction must pass the `@prisma/adapter-pg` adapter (`src/lib/db.ts`); scripts use `createScriptPrismaClient()` (capped pool) not the app singleton
- Auth/collection code already scopes every query/mutation to the session `userId` (see `src/lib/collection/actions.ts`) — preserve that pattern for any new user-owned data (decks, Phase 2.2)
