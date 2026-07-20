# MTGPlayground — Agent Guide

**Read this file first** in every new chat before implementing or planning work.

## Project summary

**MTGPlayground** is a Magic: The Gathering web app: Scryfall-backed **printing-first catalog**, personal **collection**, **multi-format deck building**, then community publish/ratings/rankings on platform data only.

- **Package:** `mtgplayground` (UI brand MTGPlayground)
- **Repo:** https://github.com/VincenzoLaRosaDev/edhforge (folder/GitHub name may still be `edhforge` until ops rename)
- **Language (MVP):** English only — UI, DB fields, enums
- **Formats:** Multi-format decks (not Commander-only)
- **Current phase:** Phase **2.1** Auth + Collection (Phase 2.0 pivot ✅)

## Required reading (in order)

| File | Contents |
|---|---|
| [`docs/PROJECT.md`](docs/PROJECT.md) | Vision, entities, MVP — **MTGPlayground pivot** |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data sources, sync |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase checklist — start at **2.1** |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log — append, never delete |
| [`docs/UI.md`](docs/UI.md) | Shell / discovery UI (partially legacy; update as pivot lands) |

## Documentation maintenance (mandatory)

When you change **product scope**, **architecture**, **data sources**, **schema**, **auth**, or **phase status**, update the relevant doc **in the same change**:

| Change type | Update |
|---|---|
| New/changed feature or limit | `docs/PROJECT.md` + `docs/DECISIONS.md` |
| New table, service, sync job | `docs/ARCHITECTURE.md` + `docs/ROADMAP.md` if phase task |
| Completed phase task | `docs/ROADMAP.md` |
| Significant choice (why X not Y) | `docs/DECISIONS.md` (new dated entry) |
| Setup/env/script changes | `README.md` |

**Format for new decisions** (`docs/DECISIONS.md`):

```markdown
## YYYY-MM-DD — Short title
**Context:** …
**Decision:** …
**Consequences:** …
```

## Code conventions

- **Minimize scope** — smallest correct diff; match existing patterns
- **External-first data** — Scryfall (+ MTGJSON precons); no live meta scrape; no EDHREC cache
- **Printing-first** — versions (set/art/foil) and multiface are product requirements, not collection-only
- **Prisma 7** — `@prisma/adapter-pg`; import from `@/generated/prisma/client`
- **No ML in MVP** — heuristics + classifications; community stats from own corpus only
- **Attribution** — Scryfall + WotC; no paywall on card data

## Quick status

```
Phase 0–1.8 ✅  Catalog foundation (historical EDHForge / Scryfall path)
Phase 2.0 ✅  Pivot: MTGPlayground, printings, unified detail, version picker
Phase 2.1 ⬜  Auth + printing-level collection — **current**
Phase 2.2 ⬜  Multi-format deck builder + owned/missing
Phase 2.3 ⬜  Precons (MTGJSON)
Phase 3 ⬜  Analysis (platform-native)
Phase 4 ⬜  Community publish / ratings / rankings (multi-format)
Phase 5 ⬜  Polish & launch
```

See `docs/ROADMAP.md` for detailed task lists.
