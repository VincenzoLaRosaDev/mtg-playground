# EDHForge — Development Roadmap

> Last updated: 2026-07-12 · Update checkboxes and dates as work completes.

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
| 0.11 | GitHub Actions daily Scryfall sync | ✅ | 2026-07-10 |
| 0.12 | Scryfall oracle_tags sync + card roles | ✅ | 2026-07-10 |
| 0.13 | `card-overrides.json` (~200 staples) | ✅ | 2026-07-10 |

**Demo:** Search Sol Ring → see card with image and type.

**Remaining before / during Phase 1:** none — Phase 0 complete.

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
| 1.3c | Exclude Scryfall `art_series` from catalog + relink EDHREC | ✅ | 2026-07-10 |

**Demo:** Search Atraxa → full commander profile with top cards, salt, rank.

---

## Phase 1.4 — Commander catalog sync ✅

**Goal:** Pre-populate EDHREC commander profiles for the full catalog before Phase 1.5 browse/detail UX. Spec: `docs/DECISIONS.md` (2026-07-10 commander data completeness).

**Coverage expectation:** ~90% of catalog commanders get full EDHREC meta (COLD tier, 30d TTL). ~10% have no EDHREC commander page (`card_only` planeswalkers etc.) → browse shows badge **“No EDHREC meta”** in Phase 1.5.

**Run (batched):**

```bash
npm run sync:edhrec-commanders-catalog                      # first 150 missing (default)
npm run sync:edhrec-commanders-catalog -- --batch-size=500  # larger batch
npm run sync:edhrec-commanders-catalog -- --offset=500        # continue same list
npm run sync:edhrec-commanders-catalog -- --all             # refresh existing (preserves HOT tier)
```

Re-run until “All catalog commander slugs with EDHREC pages are cached.” Full missing set ≈45–60 min at 1 req/s for ~2.5k slugs.

| # | Task | Status | Done |
|---|---|---|
| 1.4.1 | `scripts/sync/edhrec-commanders-catalog.ts` — iterate `cards.is_commander`, fetch commander JSON, skip `card_only` | ✅ | 2026-07-10 |
| 1.4.2 | Batch runner: `--batch-size`, `--offset`, rate limit, resume + SyncLog | ✅ | 2026-07-10 |
| 1.4.3 | npm script + optional GH Action (monthly / manual dispatch) | ✅ | 2026-07-10 |
| 1.4.4 | Document expected coverage (~90% full meta, ~10% badge-only) | ✅ | 2026-07-10 |

**Prerequisite for:** Phase 1.5 commander browse (All tab with badges) and commander tab on card detail.

**Demo:** `npm run sync:edhrec-commanders-catalog` fills ~2.5k profiles; Abdel Adrian has rank/themes without a page visit.

---

## Phase 1.5 — Discovery consistency ✅

**Goal:** Coherent browse, search, and detail UX. Spec: `docs/PROJECT.md` § Discovery consistency.

| # | Task | Status | Done |
|---|---|---|---|
| 1.5.1 | Browse API contract: `cursor`, `sort`, `total`, `nextCursor` | ✅ | 2026-07-10 |
| 1.5.2 | `/cards` browse: tabs + sort + filters + load more | ✅ | 2026-07-10 |
| 1.5.3 | `/commanders` browse: tabs + catalog fallback + load more | ✅ | 2026-07-10 |
| 1.5.4 | `/sets` browse: pagination + sort + set-type filters | ✅ | 2026-07-10 |
| 1.5.5 | Global navbar search (`GET /api/search`) — cards, commanders, sets | ✅ | 2026-07-10 |
| 1.5.6 | `/cards/[slug]` commander tab + cross-link; no 404 without EDHREC | ✅ | 2026-07-10 |
| 1.5.7 | `/commanders/[slug]` parallel route + soft fallback | ✅ | 2026-07-10 |
| 1.5.8 | Set → card links with `?set=`; card detail uses `set_cards` image | ✅ | 2026-07-10 |
| 1.5.9 | Visual polish pass | ↪️ | Absorbed into **Phase 1.6** |

**Demo:** Land on `/cards` → see popular staples; search Sol Ring in navbar; open Plains from MKM set → correct art; Atraxa card ↔ commander cross-nav.

---

## Phase 1.6 — Discovery parity (EDHREC-like UI) ✅

**Goal:** EDHREC-like discovery density and behaviour on lists + card/commander detail. **Completed 2026-07-14** — unblocks Phase 2. Spec: `docs/PROJECT.md` § Discovery parity · decisions: `docs/DECISIONS.md` (2026-07-12).

**Delivery:** single epic branch (includes uncommitted Phase 1.5 UX work).

**Out of scope:** `/themes` hub routes, dedicated Saltiest pages, external deck-builder links, average deck when not in cached JSON, full **38k card catalog** EDHREC sweep.

**Data strategy (confirmed):** **D+** top-list parity (`edhrec_top_entries` + fixed top JSON sync) · **F1** card detail Theme/Budget via `edhrec_page_variants` (after spike). Existing HOT / catalog / profile tables **stay** — see `docs/ARCHITECTURE.md` § EDHREC cache layers.

### Implementation order (do not skip waves)

```
Wave 0 → baseline + UI kit + tab labels
Wave 1 → commander detail sections (cardlists parser)
Wave 2 → EDHREC data parity (spikes, schema, top sync, client URL fix)
Wave 3 → browse wired to top index + time window + grid
Wave 4 → page variants + filter bars (commander + card detail)
Wave 5 → card detail body (similar, prices, salt)
Wave 6 → search / sets / home
Wave 7 → polish
```

| # | Task | Wave | Status |
|---|---|---|---|
| **1.6.0** | **Epic baseline** — integrate uncommitted Phase 1.5 work; neutral user-facing copy | 0 | ✅ | 2026-07-14 |
| **1.6.1** | **Discovery UI kit** — grid/list toggle (default grid), `CardGridTile`, rank badge, inclusion % + synergy formatters, salt badge, `PopularityUnavailableBadge` (prod) | 0 | ✅ | 2026-07-12 |
| **1.6.2** | **Browse tabs + density** — **Most played · Top commanders · All**; primary tabs dominant; desktop-dense layout | 0 | ✅ | 2026-07-12 |
| **1.6.5** | **`cardlists` parser** — all known EDHREC list `tag`/`header` keys; `CardListSection` + `CardMetricRow` | 1 | ✅ | 2026-07-13 |
| **1.6.6** | **Commander detail — sections** — all parsed cardlists; Themes \| Kindred split | 1 | ✅ | 2026-07-13 |
| **1.6.7** | **Similar commanders enriched** — thumbnail + rank + decks | 1 | ✅ | 2026-07-13 |
| **1.6.8** | **Average deck block** — if present in cached JSON; else omit | 1 | ✅ | 2026-07-13 |
| **1.6.9** | **Spike — commander filter URLs** — theme/budget/bracket path patterns; variant cache shape | 2 | ✅ | 2026-07-13 |
| **1.6.9b** | **Spike — card filter URLs + top pagination** — map card Theme/Budget JSON; paginate `pages/top/{window}.json` | 2 | ✅ | 2026-07-13 |
| **1.6.9c** | **Fix `edhrec/client.ts` top paths** — use `pages/top/{window}.json`, `pages/commanders/{window}.json` (not broken `top/cards--N` where 403) | 2 | ✅ | 2026-07-12 |
| **1.6.10** | **Prisma schema** — `edhrec_top_entries` (browse index) + `edhrec_page_variants` (filtered detail payloads) | 2 | ✅ | 2026-07-12 |
| **1.6.11** | **`scripts/sync/edhrec-top-lists.ts`** — full `list.more` pagination per window; weekly GH Action; `SyncLog` | 2 | ✅ | 2026-07-14 |
| **1.6.12** | **Browse APIs** — Most played / Top commanders read **`edhrec_top_entries`**; `window=week\|month\|year\|all`; detail still uses profile tables | 3 | ✅ | 2026-07-12 |
| **1.6.3** | **`/cards` browse UI** — grid default; wired to top-index API; time window toolbar | 3 | ✅ | 2026-07-12 |
| **1.6.4** | **`/commanders` browse UI** — grid default; rank badge; wired to top-index API | 3 | ✅ | 2026-07-12 |
| **1.6.13** | **Variant cache service** — `getCommanderDetailData` / `getCardDetailEdhrecData` + `edhrec_page_variants`; default row still in profile tables | 4 | ✅ | 2026-07-13 |
| **1.6.14** | **Commander filter bar** — Theme + Budget + Bracket; reload sections on change | 4 | ✅ | 2026-07-13 |
| **1.6.15** | **Card filter bar** — Theme + Budget (post-1.6.9b); same variant cache | 4 | ✅ | 2026-07-13 |
| **1.6.16** | **Card detail body** — similar cards, Scryfall USD prices, salt badge, synergy on top commanders; relatives; **EDHREC cardlists** (top cards, game changers, type buckets) | 5 | ✅ | 2026-07-13 |
| **1.6.17** | **`/search`** — compact horizontal result rows (Card + thumbnail); aligned tokens | 6 | ✅ | 2026-07-14 |
| **1.6.18** | **`/sets` + `/sets/[code]`** — horizontal set cards in wide grid; set detail filters in toolbar | 6 | ✅ | 2026-07-14 |
| **1.6.19** | **Home `/`** — discovery shortcuts (Most played, Top commanders) | 6 | ✅ | 2026-07-13 |
| **1.6.20** | **Final polish** — responsive, empty states, **icon system** (mana/rarity/lucide), docs checklist; mark Phase 1.6 complete | 7 | ✅ | 2026-07-14 |
| **1.7.1** | **UI kit** — shadcn/ui + violet theme + discovery shell refactor | — | ✅ | 2026-07-14 |

**Backlog (post-1.6):** Card Printings tab · `/themes` hub · dedicated Saltiest routes · full card-catalog EDHREC sweep.

**Demo:** Top lists match EDHREC year window (paginated sync) → grid browse → Atraxa with filter bar + multi-section cardlists → Sol Ring with Theme/Budget filters changing top commanders → similar + prices.

**Prerequisite for:** Phase 2 deck builder.

**Phase 1.6 complete** (2026-07-14) — discovery parity gate cleared; start Phase 2.

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
