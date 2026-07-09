# EDHForge — Development Roadmap

> Last updated: 2026-07-09 · Update checkboxes and dates as work completes.

**Legend:** ✅ done · 🔄 in progress · ⬜ todo

---

## Phase 0 — Setup + Card Catalog ✅

**Goal:** Searchable Scryfall catalog in Neon.

| # | Task | Status | Done |
|---|---|---|---|
| 0.1 | Next.js 16 + TS + Tailwind scaffold | ✅ | 2026-07-09 |
| 0.2 | Prisma 7 + Neon + Card/SyncLog schema | ✅ | 2026-07-09 |
| 0.3 | Scryfall bulk sync script | ✅ | 2026-07-09 |
| 0.4 | `GET /api/cards/search` | ✅ | 2026-07-09 |
| 0.5 | `/cards` search page | ✅ | 2026-07-09 |
| 0.6 | Landing page `/` | ✅ | 2026-07-09 |
| 0.7 | Project docs + Cursor rules | ✅ | 2026-07-09 |
| 0.8 | GitHub remote connected | ✅ | 2026-07-09 |
| 0.9 | Initial commit + push to GitHub | ✅ | 2026-07-09 |
| 0.10 | Run first `npm run sync:scryfall` on Neon | ✅ | 2026-07-09 (38,233 cards) |
| 0.11 | GitHub Actions daily Scryfall sync | ⬜ | |
| 0.12 | Scryfall oracle_tags sync + card roles | ⬜ | |
| 0.13 | `card-overrides.json` (~200 staples) | ⬜ | |

**Demo:** Search Sol Ring → see card with image and type.

**Remaining before / during Phase 1:** 0.11 (cron sync), 0.12 (oracle tags), 0.13 (card overrides). Core catalog is live; these are ops + classification prep for Phase 3.

---

## Phase 1 — Discovery (EDHREC-like) ✅

**Goal:** Browse cards and commanders like a lightweight EDHREC.

| # | Task | Status | Done |
|---|---|---|---|
| 1.1 | Prisma: EdhrecCommanderProfile, EdhrecCardData | ✅ | 2026-07-09 |
| 1.2 | EDHREC slug precompute on cards | ✅ | 2026-07-09 (Phase 0 sync) |
| 1.3 | `scripts/sync/edhrec-commanders.ts` (top 500) | ✅ | 2026-07-09 |
| 1.3b | Fix `toEdhrecSlug()` + improve commander sync discovery | ✅ | 2026-07-09 |
| 1.4 | `scripts/sync/edhrec-cards.ts` (top 2000) | ✅ | 2026-07-09 |
| 1.5 | EDHREC on-demand fetch + cache (cold tier) | ✅ | 2026-07-09 |
| 1.6 | `/cards/[slug]` detail page | ✅ | 2026-07-09 |
| 1.7 | `/commanders` browse + search | ✅ | 2026-07-09 |
| 1.8 | `/commanders/[slug]` detail page | ✅ | 2026-07-09 |
| 1.9 | `/sets` + `/sets/[code]` | ✅ | 2026-07-09 |
| 1.10 | Relatives by subtype section | ✅ | 2026-07-09 |
| 1.11 | SEO: metadata, sitemap | ✅ | 2026-07-09 |
| 1.12 | GitHub Actions weekly EDHREC sync | ✅ | 2026-07-09 |
| 1.13 | Stale cache banner when EDHREC unavailable | ✅ | 2026-07-09 |

**Demo:** Search Atraxa → full commander profile with top cards, salt, rank.

---

## Phase 2 — Deck Builder ⬜

**Goal:** Create, import, edit, save Commander decks.

| # | Task | Status |
|---|---|---|
| 2.1 | Auth.js: email + Google + Discord | ⬜ |
| 2.2 | Prisma: User, Deck, DeckCard | ⬜ |
| 2.3 | `packages/analysis` v1: curve, types, lands, colors | ⬜ |
| 2.4 | Arena paste parser | ⬜ |
| 2.5 | Live deck editor UI | ⬜ |
| 2.6 | Commander legality engine | ⬜ |
| 2.7 | Real-time stats panel in editor | ⬜ |
| 2.8 | Guest flow `/analyze` | ⬜ |
| 2.9 | Deck CRUD `/my/decks` | ⬜ |
| 2.10 | User deck limits enforcement | ⬜ |
| 2.11 | Fork from publication (stub for Phase 4) | ⬜ |

**Demo:** Import list → fix errors → live curve → register → save.

---

## Phase 3 — Intelligence Layer ⬜

**Goal:** Deep analysis + meta comparison vs EDHREC.

| # | Task | Status |
|---|---|---|
| 3.1 | Functional counts (removal/ramp/draw/counter/discard) | ⬜ |
| 3.2 | 14 synergy themes (card + deck level) | ⬜ |
| 3.3 | Adaptive UI (60% threshold) | ⬜ |
| 3.4 | Commander coherence alerts | ⬜ |
| 3.5 | Meta Comparison section (curve, roles, staples, themes) | ⬜ |
| 3.6 | Archetype auto-detect from EDHREC tag_counts | ⬜ |
| 3.7 | Deck salt score | ⬜ |
| 3.8 | `/my/decks/[id]/analysis` page | ⬜ |
| 3.9 | Feature gating guest vs registered | ⬜ |

**Demo:** Full analysis with staples missing + curve vs EDHREC.

---

## Phase 4 — Community ⬜

**Goal:** Publish, vote, profiles, rankings.

| # | Task | Status |
|---|---|---|
| 4.1 | DeckPublication + PublicationCard schema | ⬜ |
| 4.2 | Publish flow (immutable snapshot) | ⬜ |
| 4.3 | Fork publication → new Deck | ⬜ |
| 4.4 | Multi-axis rating (power/budget/originality) | ⬜ |
| 4.5 | Self-declared vs community power display | ⬜ |
| 4.6 | Public profile `/users/[username]` | ⬜ |
| 4.7 | Bayesian rankings (weekly + all-time) | ⬜ |
| 4.8 | Rankings pages (global, commander, theme) | ⬜ |
| 4.9 | Retire + hard delete (cascade) | ⬜ |
| 4.10 | Report content | ⬜ |

**Demo:** Publish → receive votes → appear in weekly ranking.

---

## Phase 5 — Polish & Launch ⬜

**Goal:** Production-ready.

| # | Task | Status |
|---|---|---|
| 5.1 | MTGJSON precon import | ⬜ |
| 5.2 | Onboarding + empty states | ⬜ |
| 5.3 | Performance pass | ⬜ |
| 5.4 | Sentry + sync health monitoring | ⬜ |
| 5.5 | E2E tests (import, publish, vote) | ⬜ |
| 5.6 | Premium tier schema (no billing) | ⬜ |
| 5.7 | Production deploy + custom domain | ⬜ |

---

## How to update this file

When completing a task:

1. Change `⬜` → `✅` and add date in Done column (Phase 0) or note in commit
2. If adding new tasks, insert with next number in the correct phase
3. If a phase scope changes, update `docs/PROJECT.md` and log in `docs/DECISIONS.md`
