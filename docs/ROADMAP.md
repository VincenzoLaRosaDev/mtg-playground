# MTGPlayground — Development Roadmap

> Last updated: 2026-07-20 · Product pivot active — start at **Phase 2.0**

**Legend:** ✅ done · 🔄 in progress · ⬜ todo · 🚫 blocked / needs redesign

---

## Phase 0 — Setup + Card Catalog ✅

**Goal:** Searchable Scryfall catalog in Neon.

| # | Task | Status | Done |
|---|---|---|---|
| 0.1 | Next.js 16 + TS + Tailwind scaffold | ✅ | 2026-07-09 |
| 0.2 | Prisma 7 + Neon + Card/SyncLog schema | ✅ | 2026-07-09 |
| 0.3 | Scryfall bulk sync script | ✅ | 2026-07-09 |
| 0.4 | `GET /api/cards/search` (later removed → `/api/search`) | ✅ | 2026-07-09 |
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
| **1.7.1** | **UI kit** — shadcn/ui + theme tokens + discovery shell refactor (later: dark-only orange) | — | ✅ | 2026-07-14 |

**Backlog (post-1.6):** Card Printings tab · `/themes` hub · dedicated Saltiest routes · full card-catalog EDHREC sweep.

**Demo:** Top lists match EDHREC year window (paginated sync) → grid browse → Atraxa with filter bar + multi-section cardlists → Sol Ring with Theme/Budget filters changing top commanders → similar + prices.

**Prerequisite for:** Phase 2 deck builder.

**Phase 1.6 complete** (2026-07-14) — discovery parity gate cleared; start Phase 2.

### Ops hardening (pre–Phase 2 / audit)

| # | Task | Status | Done |
|---|---|---|---|
| Ops.1 | Browse sync health includes `top_lists` + `EdhrecSyncNotice` on `/cards` `/commanders` | ✅ | 2026-07-16 |
| Ops.2 | Weekly EDHREC workflow purges expired `edhrec_page_variants` (still gated off) | ✅ | 2026-07-16 |
| Ops.3 | Docs/.env: drop phantom `SYNC_CRON_SECRET` / `/api/sync` | ✅ | 2026-07-16 |
| Ops.4 | Enable GH Actions sync (`DATABASE_URL` secret + `SYNC_JOBS_ENABLED` + cron) | ⬜ | When ready |
| Ops.5 | Delete leftover browse/search code + refresh ARCHITECTURE tree | ✅ | 2026-07-16 |
| Ops.6 | `useBrowseList` hook + split `lib/browse/cards*` modules | ✅ | 2026-07-16 |
| Ops.7 | Vitest unit tests: browse cursor, slug, cardlists parsers | ✅ | 2026-07-16 |
| Ops.8 | DB indexes: sync_logs + browse sort/TTL columns | ✅ | 2026-07-16 |
| Ops.9 | Atomic `edhrec_top_entries` window rewrite | ✅ | 2026-07-16 |
| Ops.10 | SSR first page for browse lists (`/cards` `/commanders` `/catalog` `/sets`) | ✅ | 2026-07-16 |
| Ops.13 | Top-index browse: SQL keyset page (no full-window load) | ✅ | 2026-07-16 |
| Ops.14 | Detail EDHREC loaders: explicit selects; lite profile for themes | ✅ | 2026-07-16 |
| Ops.15 | Sync upserts: `select: { id }` to cut RETURNING egress | ✅ | 2026-07-16 |
| Ops.16 | `unstable_cache` default browse hydrate (1h + tags) | ✅ | 2026-07-16 |

**Audit follow-ups (deferred — pick up if/when needed):**

| # | Item | When |
|---|---|---|
| Ops.4 | Enable GH Actions sync (secret + flag + cron) | Before public deploy / stale data matters |
| Ops.11 | GIN FTS on card text search (`search_tsv`) for browse + global `q` | ✅ | 2026-07-21 |
| Ops.11b | GIN on `color_identity` / trigram if color/type filter queries slow | Measured need |
| Ops.12 | Safer `card_classifications` rebuild (txn/swap) + review soft FKs (`printings` / taggings) | Before Phase 3 analysis depends on classifications |
| — | Sentry + E2E | Already Phase 5.4 / 5.5 |
| — | Deck builder / auth / analysis | Phase 2+ (below) |

---

## Phase 1.7 — Remove EDHREC dependency ✅

**Goal:** ToS-safe Scryfall-only discovery baseline.

| # | Task | Status | Done |
|---|---|---|---|
| 1.7.1 | Drop EDHREC schema/tables; rename edhrec_slug → slug | ✅ | 2026-07-20 |
| 1.7.2 | Remove EDHREC sync scripts + GH workflows | ✅ | 2026-07-20 |
| 1.7.3 | Catalog-first /cards /commanders; detail shells | ✅ | 2026-07-20 |
| 1.7.4 | Docs + tests updated | ✅ | 2026-07-20 |

**Next:** Phase 1.8 Scryfall discovery enrichment.

---

## Phase 1.8 — Scryfall discovery enrichment ✅

**Goal:** Faceted `/browse` hub + D2 detail (Popularity / Friction / roles / related / build skeleton) without EDHREC or deck-corpus meta. **Completed 2026-07-20.**

| # | Task | Status | Done |
|---|---|---|---|
| 1.8.1 | Schema: popularity_rank, GC, reserved, mana/P/T/loyalty, friction_score, card_relations; Scryfall sync + friction denorm | ✅ | 2026-07-20 |
| 1.8.2 | Hub `/browse` (Cards \| Commanders) + `GET /api/browse` facets; redirects `/cards` `/commanders`; tile Popularity/Friction | ✅ | 2026-07-20 |
| 1.8.3 | Detail D2: hero meta, role staples / GC in CI, themes, similar, related parts, build skeleton | ✅ | 2026-07-20 |
| 1.8.4 | Docs (DECISIONS / PROJECT / ARCHITECTURE / UI / ROADMAP) | ✅ | 2026-07-20 |

**Out of v1:** keyword explorer, P/T filters, time windows, inclusion %, empirical synergy %.

**Next:** Product pivot → MTGPlayground (see Phase 2.0).

---

## Phase 2.0 — Product pivot (MTGPlayground) ✅

**Goal:** Reposition from EDHForge commander-center to **MTGPlayground**: printing-first catalog, collection, multi-format decks. Spec: `docs/PROJECT.md` · decision: `docs/DECISIONS.md` (2026-07-20 pivot). **Completed 2026-07-20.**

| # | Task | Status | Done |
|---|---|---|---|
| 2.0.1 | Docs locked (PROJECT / ROADMAP / AGENTS / ARCHITECTURE / DECISIONS) | ✅ | 2026-07-20 |
| 2.0.2 | Repo/package/UI rebrand `EDHForge` → `MTGPlayground` | ✅ | 2026-07-20 |
| 2.0.3 | Catalog honesty: Popularity copy = inclusion rank; deprecate commanders-as-meta hub | ✅ | 2026-07-20 |
| 2.0.4 | Unify card detail (remove Card \| Commander dual view); slim ex-D2 commander page | ✅ | 2026-07-20 |
| 2.0.5 | Printing model: expand/replace `set_cards` → full Printings (finish, faces, prices) + sync | ✅ | 2026-07-20 |
| 2.0.6 | Multiface UI on detail + tiles | ✅ | 2026-07-20 |
| 2.0.7 | Version picker (set / art / foil) site-wide | ✅ | 2026-07-20 |

**Demo:** One card page with multiple printings + face toggle; browse no longer implies commander meta.

**Follow-up (2026-07-20):** Dropped Related parts / `card_relations` (Scryfall `all_parts`) from PDP + sync — see `docs/DECISIONS.md`.

**Follow-up (2026-07-21):** Card detail two-band layout + **As card / As commander** list packs (`?view=commander`) — see `docs/DECISIONS.md`. D2 helpers remain on detail for commander view; Phase **2.2.6** still covers deck-builder reuse.

**Next:** Phase 2.1 Auth + Collection.

---

## Phase 2.1 — Auth + Collection ⬜

**Goal:** Accounts and printing-level personal collection.

| # | Task | Status |
|---|---|---|
| 2.1.1 | Auth.js: email + Google + Discord | ⬜ |
| 2.1.2 | Prisma: User, CollectionItem (printing + finish + qty) | ⬜ |
| 2.1.3 | Collection CRUD UI + search add | ⬜ |
| 2.1.4 | Collection import (CSV / paste with printing resolve) | ⬜ |
| 2.1.5 | Wantlist flag | ⬜ |

**Demo:** Add MH2 Sol Ring foil ×1 → see it in collection.

---

## Phase 2.2 — Multi-format deck builder ⬜

**Goal:** Create/import/edit decks for multiple formats; owned/missing vs collection.

| # | Task | Status |
|---|---|---|
| 2.2.1 | Prisma: Deck, DeckCard (+ format, optional preferred printing) | ⬜ |
| 2.2.2 | Live editor UI | ⬜ |
| 2.2.3 | Multi-format legality engine | ⬜ |
| 2.2.4 | Arena paste parser | ⬜ |
| 2.2.5 | Owned / missing vs collection (oracle aggregate) | ⬜ |
| 2.2.6 | Builder insights (roles / GC / friction / relations — reuse detail D2 helpers) | ⬜ |
| 2.2.7 | Deck CRUD `/my/decks` + limits | ⬜ |
| 2.2.8 | Guest analyze (optional) | ⬜ |

**Demo:** Build a Modern deck → see missing cards vs collection → save.

---

## Phase 2.3 — Precons (MTGJSON) ⬜

**Goal:** Official precon browse + fork into deck + gap vs collection.

| # | Task | Status |
|---|---|---|
| 2.3.1 | MTGJSON precon sync | ⬜ |
| 2.3.2 | `/precons` browse + detail | ⬜ |
| 2.3.3 | Fork precon → deck | ⬜ |
| 2.3.4 | Owned vs precon checklist | ⬜ |

---

## Phase 3 — Analysis (platform-native) ⬜

**Goal:** Deck intelligence without external meta scrape.

| # | Task | Status |
|---|---|---|
| 3.1 | Curve, types, lands, colors | ⬜ |
| 3.2 | Functional role counts (classifications) | ⬜ |
| 3.3 | Theme overlap (deck-level) | ⬜ |
| 3.4 | Format coherence alerts | ⬜ |
| 3.5 | Compare vs precon / own publications (not EDHREC) | ⬜ |
| 3.6 | Analysis page `/my/decks/[id]/analysis` | ⬜ |

**Supersedes:** Old Phase 3 “vs EDHREC profile” tasks.

---

## Phase 4 — Community (multi-format) ⬜

**Goal:** Publish, vote, profiles, rankings on **platform corpus**, multi-format.

| # | Task | Status |
|---|---|---|
| 4.1 | DeckPublication + PublicationCard schema | ⬜ |
| 4.2 | Publish flow (immutable snapshot) | ⬜ |
| 4.3 | Fork publication → new Deck | ⬜ |
| 4.4 | Multi-axis rating (power/budget/originality) | ⬜ |
| 4.5 | Self-declared vs community display | ⬜ |
| 4.6 | Public profile `/users/[username]` | ⬜ |
| 4.7 | Bayesian rankings (weekly + all-time; by format) | ⬜ |
| 4.8 | Rankings pages (global, format, commander/archetype) | ⬜ |
| 4.9 | Retire + hard delete | ⬜ |
| 4.10 | Report content | ⬜ |

**Demo:** Publish → votes → weekly ranking for that format.

---

## Phase 5 — Polish & Launch ⬜

**Goal:** Production-ready MTGPlayground.

| # | Task | Status |
|---|---|---|
| 5.1 | Onboarding + empty states | ⬜ |
| 5.2 | Performance pass (printings volume) | ⬜ |
| 5.3 | Sentry + sync health | ⬜ |
| 5.4 | E2E (collection, deck, publish) | ⬜ |
| 5.5 | Premium tier schema (no billing) | ⬜ |
| 5.6 | Production deploy + domain | ⬜ |

---

## Superseded roadmap (EDHForge Commander-only)

The following pre-pivot phases remain in git history for reference but are **not** the active plan:

- ~~Phase 2 — Deck Builder (Commander-only)~~ → replaced by **2.1–2.2**
- ~~Phase 3 — Intelligence vs EDHREC~~ → replaced by **Phase 3 platform-native**
- ~~Phase 4–5 as originally scoped~~ → reframed above (precons moved earlier as **2.3**)

---

## How to update this file

When completing a task:

1. Change `⬜` → `✅` (or `🔄`) and add date where useful
2. If adding new tasks, insert with next number in the correct phase
3. If a phase scope changes, update `docs/PROJECT.md` and log in `docs/DECISIONS.md`
