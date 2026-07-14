# EDHForge — Agent Guide

**Read this file first** in every new chat before implementing or planning work.

## Project summary

**EDHForge** is a Commander-first web app: EDHREC-like discovery (cards, commanders, sets) plus deck analysis, meta comparison vs EDHREC, and a community layer (publish, multi-axis ratings, rankings).

- **Repo:** https://github.com/VincenzoLaRosaDev/edhforge
- **Language (MVP):** English only — UI, DB fields, enums
- **Format (MVP):** Commander only (other formats → backlog)
- **Current phase:** Phase 1.6 complete → **Phase 2** (deck builder, import, auth)

## Required reading (in order)

| File | Contents |
|---|---|
| [`docs/PROJECT.md`](docs/PROJECT.md) | Vision, features MVP/V2, entities, user flows, limits |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data sources, sync jobs, folder structure |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase checklist with status — update as tasks complete |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log — append new entries, never delete history |
| [`docs/UI.md`](docs/UI.md) | Shell, tokens, discovery components — Phase 1.6 parity spec |
| [`docs/PROJECT.md`](docs/PROJECT.md) § Discovery parity | Phase 1.6 browse/detail/filter spec |

## Documentation maintenance (mandatory)

When you change **product scope**, **architecture**, **data sources**, **schema**, **auth**, or **phase status**, update the relevant doc **in the same change** (same PR/commit):

| Change type | Update |
|---|---|
| New/changed feature or limit | `docs/PROJECT.md` + `docs/DECISIONS.md` |
| New table, service, sync job | `docs/ARCHITECTURE.md` + `docs/ROADMAP.md` if phase task |
| Completed phase task | `docs/ROADMAP.md` (check box + date) |
| Significant choice (why X not Y) | `docs/DECISIONS.md` (new dated entry) |
| Setup/env/script changes | `README.md` |

**Format for new decisions** (`docs/DECISIONS.md`):

```markdown
## YYYY-MM-DD — Short title
**Context:** …
**Decision:** …
**Consequences:** …
```

Do not rely on chat history — if it is not in these files, it does not exist for future agents.

## Code conventions

- **Minimize scope** — smallest correct diff; match existing patterns
- **External-first data** — Scryfall bulk + EDHREC cache; no live API calls in user hot paths
- **Prisma 7** — use `@prisma/adapter-pg` adapter; import from `@/generated/prisma/client`
- **Analysis engine** — pure TS in `packages/analysis` (Phase 2+); pre-computed card roles, not live regex
- **No ML in MVP** — statistical distance vs EDHREC profiles; regex/otag for card classification
- **Attribution** — Scryfall + EDHREC links in footer; no paywall on card data

## Quick status

```
Phase 0 ✅  Scryfall sync, card search, oracle tags + classifications
Phase 1 ✅  EDHREC discovery (commanders, cards, sets)
Phase 1.4 ✅  Commander catalog EDHREC sync
Phase 1.5 ✅  Discovery consistency (browse, search, detail)
Phase 1.6 ✅  Discovery parity (EDHREC-like UI)
Phase 2 ⬜  Deck builder, import, auth — **current**
Phase 3 ⬜  Analysis + meta comparison
Phase 4 ⬜  Community (publish, vote, rankings)
Phase 5 ⬜  Polish, precons, launch
```

See `docs/ROADMAP.md` for detailed task lists.
