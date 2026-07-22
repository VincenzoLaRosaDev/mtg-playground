# MTGPlayground — Decision Log

Append-only log of significant product and technical decisions.  
**Never delete entries** — add superseding entries if a decision changes.

Format for new entries:

```markdown
## YYYY-MM-DD — Title
**Context:** Why the question came up.
**Decision:** What we chose.
**Consequences:** Impact on code, UX, or roadmap.
**Supersedes:** (optional) link to earlier entry this replaces.
```

---

## 2026-07-08 — Commander-first product scope

**Context:** Initially planned all MTG formats; meta comparison complexity varies by format.

**Decision:** MVP is **Commander-only**. EDHREC as primary meta source. MTGGoldfish scraping deferred.

**Consequences:** Single format simplifies legality, meta, and UI. Constructed support is V2+ backlog.

---

## 2026-07-08 — Deck vs DeckPublication (two-tier model)

**Context:** Public decks that remain editable invalidate community votes after major changes.

**Decision:** **`Deck`** = private editable workspace. **`DeckPublication`** = immutable snapshot at publish time. Votes/rankings attach to Publication only.

**Consequences:** Publish flow creates copy; retire hides publication; hard delete cascades votes. Fork copies Publication → new Deck.

---

## 2026-07-08 — English-only MVP

**Context:** User base and card names are primarily English; i18n adds complexity.

**Decision:** All UI strings, DB enums, and field names in **English** for MVP.

**Consequences:** No next-intl in MVP. Translations → nice-to-have.

---

## 2026-07-08 — Multi-axis rating without comments

**Context:** Social layer design for MVP vs V2.

**Decision:** Rating on **Power, Budget, Originality** (1–10). One vote per user per publication. **No comments** in MVP. **No follow** in MVP. Public profiles yes.

**Consequences:** Simpler moderation. Comments/follow in V2.

---

## 2026-07-08 — Rankings: bayesian + minimum votes

**Context:** Raw averages favor decks with 1–2 votes.

**Decision:** **Bayesian average** per axis; **min 3 votes** to enter weekly rankings. Rolling **7-day** window + all-time view.

**Consequences:** New publications show "not ranked yet" until threshold.

---

## 2026-07-08 — External-first data strategy

**Context:** Manual curation does not scale to 30k+ cards.

**Decision:** Priority: Scryfall bulk → Scryfall oracle tags → ~200 manual overrides → regex fallback. EDHREC JSON for meta (cached, tiered sync). MTGJSON for precons.

**Consequences:** No live Scryfall/EDHREC in user hot paths. Sync jobs are critical infrastructure.

---

## 2026-07-08 — No ML in MVP

**Context:** ML considered for contextual judgment and archetype detection.

**Decision:** MVP uses **statistical distance** vs EDHREC profiles and **Jaccard overlap** on theme tags. ML (clustering, supervised ratings) → V2/V3 when platform data exists.

**Consequences:** Interpretable analysis; no training pipeline in MVP.

---

## 2026-07-08 — Guest vs registered feature split

**Context:** Freemium funnel without paywall on Scryfall data (Fan Content Policy).

**Decision:** Guest: curve, lands, types only. Registered: functional counts, synergies, meta comparison, save.

**Consequences:** Clear signup CTA; card oracle/images remain public.

---

## 2026-07-08 — User limits

**Context:** DB protection and anti-spam.

**Decision:** 50 private decks, 20 active publications, 100 total publications, 250 cards/deck hard cap.

**Consequences:** Enforce in DeckService; premium tier may raise limits in V2.

---

## 2026-07-08 — Commander MVP rules

**Context:** Partner/Background/Doctor add complexity.

**Decision:** MVP supports **single commander + simple Partner**. Rest → V2.

**Consequences:** Legality engine scope limited; expand later.

---

## 2026-07-09 — Neon over Supabase for database

**Context:** Evaluated Supabase vs Neon free tier.

**Decision:** **Neon** PostgreSQL, Europe Central region. No Neon Auth — Auth.js in app (Phase 2).

**Consequences:** `DATABASE_URL` (pooled) + `DIRECT_URL` for Prisma migrations. `prisma.config.ts` uses DIRECT_URL for CLI.

---

## 2026-07-09 — Separate GitHub repository

**Context:** edhforge started sibling to v.larosa.dev portfolio site.

**Decision:** Dedicated repo `VincenzoLaRosaDev/edhforge`. Not embedded in portfolio monorepo.

**Consequences:** Open edhforge folder as Cursor workspace for MTG work.

---

## 2026-07-09 — Prisma 7 driver adapter required

**Context:** Prisma 7 removed default connection engine.

**Decision:** Use `@prisma/adapter-pg` + `pg`. Shared factory in `src/lib/db.ts`. Generated client at `src/generated/prisma/client`.

**Consequences:** All PrismaClient instantiation must pass adapter. Scripts use `createScriptPrismaClient()`.

---

## 2026-07-09 — Project documentation for agent continuity

**Context:** New Cursor chats do not inherit conversation history.

**Decision:** Maintain `AGENTS.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md` + `.cursor/rules/`. Agents must update docs when scope changes.

**Consequences:** Documentation is part of definition of done for feature work.

---

<!-- Add new decisions below this line -->

## 2026-07-09 — Hybrid EDHREC cache schema

**Context:** Phase 1 needs EDHREC commander/card pages with browse (rank) and detail (top cards, themes) without live API calls.

**Decision:** Store **indexed columns** (slug, rank, salt, numDecks, syncTier, expiresAt) plus **JSON** for nested EDHREC payloads (cardlists, tag_counts, similar). Optional `cardId` FK to `cards` resolved at sync time.

**Consequences:** Fast commander browse/sort; sync scripts map EDHREC JSON into typed fields. Full normalization deferred unless query patterns require it.

---

## 2026-07-09 — Shared app shell before visual polish

**Context:** Early pages were one-off layouts; Phase 1 adds more routes (commanders, sets, card detail sections).

**Decision:** Add minimal **app shell** (header nav, footer attribution, `PageShell`, placeholder `EdhrecSection`) before EDHREC sync. Styling stays functional, not final design.

**Consequences:** New discovery pages reuse layout components. Polish pass happens after Phase 1 demo has real data.

---

## 2026-07-09 — EDHREC commander discovery fallback

**Context:** `json.edhrec.com/top/commanders--N.json` returns 403 from some networks; Phase 1.3 still needs a ranked commander seed list.

**Decision:** Sync script tries top JSON first, then scrapes `edhrec.com/commanders` `__NEXT_DATA__` (top 100), then supplements from local `cards` (`isCommander` + `edhrecSlug`) to reach the target limit (default 500).

**Consequences:** Full top-500 ranking depends on JSON API availability; fallback guarantees HOT-tier cache population for browse/detail work in 1.7–1.8.

---

## 2026-07-09 — EDHREC on-demand cache service

**Context:** HOT sync covers top commanders/cards; long tail needs lazy population without live API calls in page components.

**Decision:** `src/lib/edhrec/cache.ts` serves card/commander data from Postgres; on miss/expiry fetches EDHREC once, upserts as **WARM** (page view, 7d TTL) or **COLD** (background, 30d TTL). Returns stale row if fetch fails.

**Consequences:** Pages import cache service only. Stale banner (1.13) consumes `isStale` + `syncedAt` from cache result.

---

## 2026-07-09 — EDHREC slug normalization + commander discovery v2

**Context:** Commander sync skipped ~50 profiles. Root cause: `toEdhrecSlug()` turned apostrophes into hyphens (`gorion-s-ward` vs `gorions-ward`) and kept accents (`ad-wal` vs `adewale`). Local catalog supplement added unverified commander slugs (planeswalkers with card pages but no commander page).

**Decision:** Align `toEdhrecSlug()` with `normalizeSearchName` (NFKD + strip diacritics), then remove apostrophes before hyphenation. Drop local `cards` alphabet supplement. When site scrape yields &lt;500, use **two-phase sync**: seed top 100 → expand from `similarSlugs` on ranked profiles in DB (EDHREC-verified names). Add `sync:backfill-edhrec-slugs` to refresh stored slugs without full Scryfall re-import.

**Consequences:** Fewer false skips on re-sync. HOT pool may stay below 500 if similar graph is shallow on first run; grows on subsequent weekly syncs. **Supersedes** local-catalog part of “EDHREC commander discovery fallback” (2026-07-09).

---

## 2026-07-09 — UI guide as living doc (pre-polish)

**Context:** Phase 1 discovery pages are largely stable; Phase 2+ adds deck workspace, not discovery rewrites. User wants polish after data is solid.

**Decision:** Add `docs/UI.md` — shell components, layout tokens, discovery patterns. Refine during Phase 1 demo polish pass; deck builder sections added in Phase 2.

**Consequences:** Agents and future UI work share one reference. Visual polish deferred until 1.3b + remaining Phase 1 demo tasks complete.

---

## 2026-07-09 — Set pages: metadata + offline card index

**Context:** Task 1.9 needs `/sets` browse and `/sets/[code]` with filters. `oracle_cards` has no set membership; Scryfall `all_cards` bulk is ~2.5GB.

**Decision:** Add `mtg_sets` + `set_cards` tables. Sync set list from `GET /sets`. Index membership via **offline** Scryfall search (`e:CODE&unique=cards`) per set in `sync:scryfall-set-cards` — not in user hot path. Set detail joins `set_cards` to `cards` on `oracle_id` when present; filters for rarity (set row), color/commander (catalog join).

**Consequences:** Full set index takes ~15–30 min for all sets; use `--limit` or `--codes=` for partial/demo runs. Unindexed sets show metadata + sync hint.

---

## 2026-07-09 — Card relatives by subtype (local catalog)

**Context:** Task 1.10; card page MVP lists relatives like EDHREC but we already have `type_line` on all oracle cards.

**Decision:** Parse subtypes from `type_line` (after `—`). Query Postgres for other **Commander-legal** cards matching any subtype with word-boundary `type_line` filters. No live Scryfall/EDHREC. Section hidden when card has no subtypes or no matches.

**Consequences:** `CardRelativesBySubtype` on `/cards/[slug]`; pure catalog feature, independent of EDHREC cache tier.

---

## 2026-07-09 — Phase 1 SEO + ops closure

**Context:** Phase 1 demo complete; need discoverability (SEO) and production ops before UI polish / Phase 2.

**Decision:** Add `createPageMetadata()` + per-route metadata; dynamic `/sitemap.xml` (static routes + EDHREC HOT entities + sets) and `/robots.txt`. Weekly `.github/workflows/sync-edhrec.yml` with `DATABASE_URL` secret. Stale UX: page-level `StaleCacheBanner` on failed refresh; browse-level `EdhrecSyncNotice` when last EDHREC sync failed or &gt;8 days old (`sync_logs`).

**Consequences:** Set `NEXT_PUBLIC_SITE_URL` in production. Sitemap hits DB on generate (daily revalidate).

---

## 2026-07-10 — Discovery consistency (Phase 1.5 scope)

**Context:** Phase 1 data exists but UX feels fragmented: empty card browse, commander list capped at ranked subset, hard API limits, split card/commander detail, wrong art when opening cards from sets.

**Decisions:**

1. **Cards browse:** Hybrid tabs — **Popular (EDHREC)** / **All cards** (catalog).
2. **Commanders browse:** **Ranked** tab + **All commanders** tab with EDHREC search + **catalog fallback** (`is_commander` without profile).
3. **URLs:** Keep **`/cards/{slug}`** and **`/commanders/{slug}` parallel**; cross-links + commander tab on card page (no redirect-only canonical).
4. **Search:** **Unified navbar search** — cards + commanders (dedupe by slug) + sets in grouped results.
5. **Printing art:** MVP **`?set={code}`** on card URLs from set pages; card detail prefers `set_cards.imageUri`. **Future:** Printings tab (all reprints) — documented, not in 1.5.

**Consequences:** Implement per `docs/ROADMAP.md` Phase 1.5 before UI polish. Browse APIs gain pagination; section pages are curated lists, not search-only. Oracle remains identity key; EDHREC optional overlay with explicit empty states.

---

## 2026-07-10 — Commander EDHREC coverage strategy

**Context:** ~3.6k commander-legal cards in catalog; only ~800 EDHREC profiles after HOT sync. Phase 1.5 needs commander tab + “All commanders” browse. EDHREC has commander pages for ~85–90% of catalog commanders; ~10–15% are “card only” (legal PW, etc.) — no commander meta exists at source.

**Decision:**

1. **Sync strategy: hybrid (C), not catalog-only (B).** Keep weekly HOT sync (top + similar). Add **Phase 1.4 catalog sweep** (`edhrec-commanders-catalog.ts`) before Phase 1.5 — batch all `is_commander`, upsert commander JSON, skip when only card page exists. On-demand WARM refresh on page view remains for misses and staleness.
2. **Browse “All commanders”:** list **all** catalog commanders; badge **“No EDHREC meta”** when no profile (after sync attempt).
3. **Order:** Phase **1.4** (data) → then **1.5** (UX).

**Why C over B:** B alone (one big catalog job, no HOT/on-demand) leaves top commanders stale between monthly sweeps and pushes first-visit latency onto users. C reuses existing HOT weekly + on-demand cache; catalog sweep is a one-time (then monthly) backfill, not the only pipeline.

**Consequences:** ~90% commanders get full tab/browse meta offline; remainder show oracle + badge. Rank remains null for most non-top commanders. Rate-limit catalog job (~45–50 min full run at 1 req/s); use batched resume.

---

## 2026-07-10 — Exclude Scryfall art_series from catalog

**Context:** Scryfall `oracle_cards` bulk includes ~2.2k `layout: art_series` collectibles (type `Card // Card`, not commander-legal). They share `edhrec_slug` with playable cards (e.g. Y'shtola, Kefka), causing wrong detail pages and mislinked EDHREC `cardId` (~92 profiles).

**Decision:** Exclude `art_series` entirely from the Commander catalog:
- Skip at `sync:scryfall` ingest; purge existing rows via `sync:purge-art-series`
- All user-facing card queries use `playableCatalogCardWhere`
- Slug → card resolution via `findPlayableCardByEdhrecSlug` (commander-legal preferred)

**Consequences:** Search/browse/detail show playable oracle only. EDHREC profiles relinked to correct `cardId`. Set pages join catalog without art_series. Tokens/emblems remain (separate slug-collision topic).

---

## 2026-07-10 — Scryfall daily sync with bulk change detection

**Context:** Phase 0.11 needs automated Scryfall updates without re-downloading ~170 MB on GitHub Actions when the bulk file is unchanged (Scryfall updates oracle_cards only when cards change).

**Decision:** Daily workflow runs `npm run sync:scryfall -- --if-changed`: compare Scryfall bulk `updated_at` to `sync_logs.errors.bulkUpdatedAt` from the last successful full sync; skip download when equal. Manual `sync:scryfall` (no flag) always downloads. Weekly Sunday job in the same workflow syncs sets + set card index.

**Consequences:** Most daily runs finish in seconds (metadata check only). First run after deploy or without prior `bulkUpdatedAt` always downloads. Shared bulk client in `src/lib/scryfall/bulk-client.ts`.

---

## 2026-07-10 — Card classification storage (Phase 0.12–0.13)

**Context:** Phase 3 analysis needs pre-computed functional roles and synergy themes per card. Scryfall Tagger oracle tags are the primary automated source; ~200 competitive staples need manual overrides.

**Decision:** Store raw taggings in `card_oracle_taggings` + derived rows in `card_classifications`. Weekly sync: `scryfall-tags.ts` (gzip JSON bulk, catalog-only taggings, skip `weak` weights) then `compute-card-classifications.ts`. Overrides in `scripts/data/card-overrides.json` keyed by `oracle_id` win entirely over tags. Removal hard/soft mapped from Tagger subtags (`removal-destroy`, `removal-bounce`, etc.). Regex fallback deferred to Phase 3.

**Consequences:** ~18k classified cards on first run (232 overrides + ~18k from tags). No user-facing UI yet. Regenerate overrides via `sync:build-card-overrides` when staple list changes.

---

## 2026-07-10 — Unified catalog UX (pre–1.5.9 polish)

**Context:** Phase 1.5 browse/search/detail exposed multiple EDHREC-branded badges, sync notices, and asymmetric card/commander detail navigation. Product goal: users perceive **one EDHForge catalog**; upstream sources are implementation detail.

**Decision:** (1) **Symmetric detail tabs** — `EntityDetailTabs` on both `/cards/{slug}` and `/commanders/{slug}` navigate between routes (no inline `?view=commander` panel). (2) **Remove user-facing EDHREC badges** — browse sync notice bar; production copy uses neutral “Popularity data”. (3) **Dev-only debug** — `CatalogDebugBadge` (collapsible, top-left) + violet `DevEdhrecCoverageBadge` on browse All tabs when overlay missing; stale-cache hints in dev only. Footer attribution to Scryfall/EDHREC unchanged (Fan Content Policy).

**Consequences:** Filter params (`has_edhrec`) unchanged in API; labels only. Commander without popularity overlay uses neutral `MetaUnavailableNotice`, not 404.

---

## 2026-07-12 — Phase 1.6 Discovery parity scope and implementation order

**Context:** Phase 1.5 delivered coherent browse/search/detail behaviour but EDHREC-like density (grid lists, multi-section commander pages, interactive filters) was deferred. Phase 2 deck builder should not start until discovery feels complete.

**Decision:**

1. **New phase 1.6** (absorbs cancelled 1.5.9 visual polish). Single epic branch; includes uncommitted Phase 1.5 UX work. **Gates Phase 2.**
2. **Browse:** toggle list/grid, **default grid**; tabs renamed **Most played / Top commanders / All**; All tabs kept but de-emphasized; Popular pool stays **HOT+WARM** (no full card catalog sync).
3. **Commander detail:** expose **all known `cardlists` sections**; Themes split **Themes | Kindred** with **inline filter** (no `/themes` hub in 1.6); **Budget + Bracket + Theme** interactive filters with **on-demand EDHREC fetch on detail only** (browse stays Postgres-only).
4. **Card detail:** similar cards, Scryfall USD prices, salt badge, synergy on top commanders; keep relatives; keep `EntityDetailTabs`.
5. **Time window** `year | all` on browse — in scope (sync/API task).
6. **Out of scope:** `/themes` hub, dedicated Saltiest routes, external deck links, average deck unless already in cached JSON.
7. **UX:** production neutral badge for missing popularity data; footer-only attribution; EDHREC loose visual reference, desktop-dense, system dark mode.
8. **Implementation waves (order matters):** shared UI kit → browse → commander sections → filter cache → card detail → time window → search/sets/home → polish.

**Why this order:** shared grid/metric components unblock cards + commanders browse and detail; commander cardlists parser before filter infrastructure; filter spike before schema/cache changes; card detail reuses metric rows; time window needs data pipeline after browse contract is stable; peripheral pages last.

**Consequences:** Task list in `docs/ROADMAP.md` § Phase 1.6. Filter-variant caching documented in ARCHITECTURE after 1.6.9 spike. `/themes` hub and Printings tab remain backlog.

---

## 2026-07-12 — EDHREC top index + page variants (extends 1.6)

**Context:** User confirmed closer EDHREC parity: browse top lists should match EDHREC numerically; card detail needs Theme/Budget filters like commander detail. Current browse uses HOT+WARM subset (~2k cards) and `rank IS NOT NULL` on profiles; top JSON client URLs partly broken (`top/cards--N` 403); working paths are `pages/top/{window}.json` and `pages/commanders/{window}.json`.

**Decision:**

1. **Top list parity (D+):** New table **`edhrec_top_entries`** — `(entity_type, window, rank, slug, metrics…)` populated by **`scripts/sync/edhrec-top-lists.ts`** (paginated top JSON). Browse **Most played / Top commanders** read this table, not `sync_tier IN (HOT,WARM)` or ad-hoc `rank IS NOT NULL`.
2. **Time window:** `week | month | year | all` on browse (default **`year`** = EDHREC “Past 2 Years”).
3. **Filter variants (F1):** New table **`edhrec_page_variants`** — keyed by `(entity_type, slug, theme?, budget?, bracket?)` with full JSON payload. Commander paths proven (`pages/commanders/{slug}/{theme}.json`, `/budget.json`, combined). Card filter URLs mapped in **spike 1.6.9b** before UI.
4. **Fix `edhrec/client.ts`** top fetchers to use `pages/top/…` and `pages/commanders/…` patterns (task 1.6.9c).
5. **No deprecation:** `edhrec_commander_profiles`, `edhrec_card_data`, HOT weekly sync, commander catalog sweep, and on-demand default cache **remain required** for detail bodies, All-tab joins, search, sitemap, and profile freshness. HOT does not replace top index; top index does not store full `cardlists`.

**Why not one table:** Top index is a **ranked, windowed, lightweight** list for browse sort/pagination. Profile tables hold **fat JSON** (cardlists, tag_counts) for detail — different shape, TTL, and update cadence.

**Supersedes:** Phase 1.6 decision (same date) item 2 “Popular pool stays HOT+WARM” for **browse primary tabs only**.

**Consequences:** Prisma migration in 1.6.10. GH Action adds top-list job. Phase 3 meta comparison still uses `edhrec_commander_profiles.tag_counts` and `card_classifications`, unchanged.

## 2026-07-13 — Commander bracket filter URL mapping

**Context:** Spike 1.6.9 — EDHREC bracket filter on commander detail; numeric `bracket-3` paths return 403.

**Decision:** Map UI bracket values `1–5` to EDHREC path slugs: `exhibition`, `core`, `upgraded`, `optimized`, `cedh`. When bracket is active, it is the **first** path segment before theme/budget (e.g. `cedh/infect/budget.json`). Filtered payloads upserted to **`edhrec_page_variants`** (WARM TTL, 7d); default profile row unchanged.

**Card filters:** `?cost=` and `?theme=` query params on `pages/cards/{slug}.json` (same variant cache). Card pages expose **Budget** filter; Theme dropdown hidden until EDHREC exposes theme list on card JSON.

**Consequences:** `src/lib/edhrec/variants.ts`, `variant-cache.ts`, filter bars on detail pages. Combined filters beyond two segments may 403 — UI keeps filter bar visible and shows an unavailable notice instead of the card-only catalog fallback.

## 2026-07-13 — Commander Mid budget not in EDHREC JSON API

**Context:** User testing (Tatyova) — selecting Budget **Mid** on commander detail hid filters and showed “Popularity data not available”. Spike assumed `pages/commanders/{slug}/middle.json` worked like `budget` / `expensive`.

**Decision:** EDHREC exposes only **Budget** and **Expensive** as commander filter slices (`/budget`, `/expensive` path segments; edhrec.com links match). `middle` path returns **403**; `?cost=middle` returns **200** but **same payload as default** (no slice). Remove **Mid** from commander filter dropdown; keep Mid on card filter (query param accepted) until 1.6.16 validates card-side deltas. When an active filter has no variant payload, keep **CommanderFilterBar** / **CardFilterBar** and show **FilterUnavailableNotice** — do not fall back to the Scryfall-only commander layout.

**Consequences:** `COMMANDER_BUDGET_OPTIONS` = budget + expensive; `CARD_BUDGET_OPTIONS` adds middle. `getUnsupportedCommanderFilterMessage()` short-circuits Mid before fetch. Supersedes ARCHITECTURE commander URL line listing `middle` as a path segment.

## 2026-07-13 — Commander rank on browse only, not detail hero

**Context:** Card/commander parity (P0) added `RankBadge` on commander detail hero. Rank in `edhrec_commander_profiles` / top index is **time-window-specific** on browse; detail has no window selector. Users landing from “Past week” could see a different rank than the global profile rank.

**Decision:** Show **rank `#N` on commander browse** (grid/row) when the active tab/window supplies it. **Do not show rank on commander detail hero.** Salt stays on hero; deck count stays in Popularity. Similar-commanders block may still show rank (that list is EDHREC’s similar set, not browse window).

**Consequences:** `DetailHeroBadges` on `/commanders/[slug]` passes `salt` only. `docs/UI.md` parity table updated.

## 2026-07-13 — Commander detail rank: all-time profile (supersedes browse-only detail rule)

**Context:** Rank was removed from commander detail hero because browse uses windowed `edhrec_top_entries` while detail had no window label — users could see conflicting ranks. Similar commanders still showed profile rank without explanation.

**Decision:** Show **all-time rank** on commander detail **hero** and **similar commanders**, sourced from **`edhrec_commander_profiles.rank`** (EDHREC default commander page JSON, no time-window param). Browse (`/commanders`) continues to use **`edhrec_top_entries`** for the selected window (`week` \| `month` \| `year` \| `all`). Hero rank always reads **base profile** (`baseEdhrec`), not filtered variant payloads. UI: tooltip “All-time EDHREC rank”; similar section footnote.

**Consequences:** `commander-rank.ts` documents the contract. **Supersedes** the “do not show rank on commander detail hero” part of the 2026-07-13 browse-only entry above.

## 2026-07-13 — Browse: top lists only, no All tab

**Context:** `/cards` and `/commanders` had **Most played / Top commanders** plus an **All** tab for full-catalog browse with EDHREC coverage badges. Phase 1.6 adds **global search** and **sets** for catalog discovery; the All tab duplicated scope and cluttered the UI.

**Decision:** Remove the **All** tab from both browse pages. `/cards` → **Top cards** and `/commanders` → **Top commanders** (EDHREC top index only, **grid-only**, larger tiles, metrics below image). API `tab=all` remains for internal/dev use. Nav and home shortcuts renamed to **Top cards** / **Top commanders**.

**Consequences:** `BrowseTabs` unused on browse pages. `CardBrowseToolbar` / `CommanderBrowseToolbar` drop `has_edhrec` filters. Grid tiles use `CardImage` `grid` variant.

## 2026-07-13 — Dedicated `/catalog` page for full card catalog

**Context:** Top cards / top commanders are EDHREC-ranked lists only. Users still need browsable access to the full Scryfall `cards` catalog with the same filters as before the All-tab removal.

**Decision:** Add **`/catalog`** — grid browse over `GET /api/cards/browse?tab=all` (playable catalog `cards` rows). Reuse filter toolbar (search, color, CMC, type, commander-legal) plus **`commanders_only`** checkbox (`is_commander = true`). Sort: name or CMC. Commander rows link to `/commanders/{slug}` when slug exists. No time window, no EDHREC rank on tiles. Nav: Top cards · Top commanders · **Catalog** · Sets.

**Consequences:** `CatalogBrowseToolbar`, `commandersOnly` on `CardBrowseFilters`. Top pages stay EDHREC-only; catalog replaces the old All-tab UX for cards.

## 2026-07-13 — Unified browse filter UI across list pages

**Context:** Set detail had multi-select color pills and rarity toggles; top cards/commanders/catalog used dropdowns or checkboxes. Set detail lacked type/CMC filters present elsewhere.

**Decision:** Shared filter kit in `browse-filter-controls.tsx` + `color-identity-filter.ts` / `rarity-filter.ts`. All card lists use **multi-select color identity pills** (`colorIdentity`, param `color=W,U`), **rarity pills** where applicable, and **toggle pills** for commander legal / commanders only / indexed only. Set detail gains **type contains** and **CMC min/max**. Panel styling unified via `browseToolbarPanelClassName`.

**Consequences:** `colors[]` replaces single `color` in browse APIs and toolbars. Commander ranked queries use `buildProfileColorIdentityWhere` on `edhrec_commander_profiles`.

## 2026-07-13 — Store `potential_decks` on `edhrec_card_data` for card detail inclusion %

**Context:** Top card browse showed inclusion % via `edhrec_top_entries` (`inclusion` + `potential_decks`). Card detail read `edhrec_card_data`, which stored `inclusion` but not `potential_decks`, so `formatInclusionPercent` returned "—" and the UI fell back to raw deck count.

**Decision:** Add `potential_decks` to `edhrec_card_data`; persist it in `mapCardData` from EDHREC card page JSON. `getCardDetailEdhrecData` uses the cached value; if missing on legacy rows, fallback to `edhrec_top_entries` (window `all`).

**Consequences:** Existing rows need re-sync (`sync:edhrec-cards` or on-demand warm fetch) for the column to populate; top-index fallback covers popular cards immediately. **Display:** EDHREC card JSON often omits `inclusion`; UI computes global inclusion % as `num_decks / potential_decks` (see `formatInclusionPercent`).

## 2026-07-13 — Remove card detail Theme/Budget filter bar

**Context:** Spike 1.6.9b mapped `?cost=` / `?theme=` on card pages. Live EDHREC JSON shows **no delta** for Budget/Mid/Expensive on staples (stats + top commanders unchanged). Phase 2–3 roadmap has no card-detail work that depends on budget slices. Commander budget remains high-value (cardlists + `num_decks` slice).

**Decision:** Remove **`CardFilterBar`** from `/cards/[slug]`; card detail always loads default `edhrec_card_data` / base variant (no filter query params). Keep commander Theme + Budget + Bracket. **`edhrec_page_variants`** card rows and `buildCardPagePath` stay for a possible future theme list on card JSON.

**Consequences:** `CARD_BUDGET_OPTIONS` and `card-filter-bar.tsx` removed. Card detail exposes remaining **`cardlists`** via `parseCardDetailCardlists` + `CardDetailCardlistSections` (see card detail cardlists entry below).

## 2026-07-13 — Card detail EDHREC cardlists sections

**Context:** Card page JSON includes many `cardlists` (top cards, game changers, type buckets) already cached in `edhrec_card_data`, but UI showed only top commanders + similar + relatives.

**Decision:** Add **`parseCardDetailCardlists`** and **`CardDetailCardlistSections`** — same `CardListSection` grid as commander detail; exclude `topcommanders` (own block) and commander-only tags (`highsynergycards`, average deck). `newcommanders` links to `/commanders/{slug}`.

**Consequences:** Card detail parity with EDHREC co-played sections without new sync jobs. Data requires warmed `edhrec_card_data` for the card slug.

## 2026-07-13 — MTG + generic icon system (Phase 1.6.20)

**Context:** Browse filters and metrics used plain text (`W`, `common`, `Ascending`, `Salt 1.23`) where EDHREC-like density benefits from icons.

**Decision:** Two layers — (1) **MTG symbols** vendored once from Scryfall mana SVGs (`src/lib/mtg/mana-symbol-data.ts`, regen via `npm run vendor:mana-symbols`) + inline `RarityIcon` gems; (2) **generic UI** via **`lucide-react`** (sort order, grid/list, search, loading). Keep text labels on `<select>` sort fields and accessibility fallbacks (`aria-label`, `sr-only`, `title`).

**Consequences:** No runtime CDN for mana in hot paths. Set icons and card art unchanged (Scryfall URLs). Future hybrid/mana-cost icons can extend `src/components/mtg/`.

## 2026-07-13 — Oracle rarity filter uses minimum printing tier

**Context:** Catalog/top-card rarity filter used “any `set_cards` row matches”, so staples with a single mythic printing (e.g. Sol Ring) appeared when filtering mythic only.

**Decision:** `resolveOracleIdsForRarities` includes an oracle only when the **lowest** printing rarity tier among all `set_cards` rows is in the selected set. Set detail (`/sets/[code]`) still filters per printing row (`setCard.rarity`).

**Consequences:** Mythic-only browse shows cards that are mythic at their base tier, not every card with a chase printing. Multi-select unions minimum tiers (e.g. uncommon + rare includes oracles whose floor is uncommon or rare).

## 2026-07-14 — EDHREC top list full sync via `list.more`

**Context:** Browse top cards/commanders showed only 100 entries per window. Spike found EDHREC paginates via `list.more` on each cardlist (e.g. `top/year-past2years-1.json`), not `--2.json` (403). Commander year ≈6.5k entries; cards year continues 20k+ pages. `window=all` top JSON returns 403.

**Decision:** (1) **`fetchPaginatedTop`** follows `list.more` until end (full sync, no cap by default). (2) **`sync:edhrec-top-lists`** syncs **week/month/year only**; optional `--max-entries` for dev. (3) Browse **`window=all`**: commanders → `edhrec_commander_profiles.rank`; cards → HOT+WARM `edhrec_card_data` (no unavailable badge). (4) GH Action timeout **360 min**.

**Consequences:** `edhrec_top_entries` grows large; weekly sync runtime increases. Browse load-more works beyond 100 once sync completes. Supersedes 1.6.9b pagination note (`--N.json`). First full local sync (2026-07-14): **108,173 rows**, **~32 MB** table, **~8 min** runtime — cards ≈30k/window, commanders up to 6,535/year.

## 2026-07-14 — Post full-sync cleanup (dead paths)

**Context:** Full top-list sync completed. Recap found dead code from pre–Option F model: `window=ALL` never populated in `edhrec_top_entries`; commander `tab=all` API unused after `/catalog`; `bracket_counts`/`budget_counts` write-only.

**Decision:** (1) Remove **`EdhrecTopWindow.ALL` fallback** in `variant-cache` for `potentialDecks`. (2) **Remove `tab=all`** from `/api/commanders/browse` — return 400 pointing to `/api/cards/browse?tab=all&commanders_only=true`. (3) Keep **`bracket_counts`/`budget_counts`** columns; comment in `parse.ts` as write-only backlog. (4) Add **`scripts/sync/purge-edhrec-page-variants.ts`** for expired variant rows. (5) Dev utility **`scripts/dev/db-health-snapshot.ts`** for row/size counts.

**Consequences:** Old commander browse cursors with `tab` field still decode; validation ignores removed `tab`. All-time browse (`window=all`) unchanged — deferred to separate review.

## 2026-07-14 — Card top browse: no All time window (option 2c)

**Context:** EDHREC has no all-time top JSON for cards (403). The `window=all` path used HOT `edhrec_card_data` (~2k rows): wrong default sort (inclusion vs rank), missing inclusion % (`potential_decks` gaps), and a different pool than week/month/year top index (~30k).

**Decision:** **Remove “All time” from `/cards` browse only.** Time windows: `week` \| `month` \| `year` (default `year`). API `GET /api/cards/browse?window=all` → **400**. **Commanders** keep `all` → `edhrec_commander_profiles.rank` (true all-time rank).

**Consequences:** Supersedes card slice of 2026-07-14 full-sync decision (3) for cards. Card detail inclusion still from `edhrec_card_data`; browse cards always uses `edhrec_top_entries`.

## 2026-07-14 — shadcn/ui design system + violet theme (Phase 1.7 UI foundation)

**Context:** UI used ad-hoc `zinc-*` Tailwind classes across 70+ components; no shared primitives for buttons, inputs, or semantic colors. Phase 1.6 functionally complete; user requested a component library baseline and visual reorganization.

**Decision:** (1) Adopt **shadcn/ui v4** (`base-nova`, Tailwind v4, `@base-ui/react`) — `components.json`, `src/lib/utils.ts` (`cn`), primitives in `src/components/ui/`. (2) **Primary brand:** violet OKLCH (`--primary` ~277° hue) — distinct from EDHREC green / Scryfall blue. (3) **`next-themes`** — system light/dark, class strategy. (4) **Wave 1 refactor:** header (`NavLinks` + sticky blur), `PageShell` toolbar slot + separator, `BrowseFilterPanel` (Card), filter pills → primary tokens, `LoadMoreButton` → Button, home shortcuts → Card grid, `RankBadge` → Badge. (5) **Keep** MTG-specific components (`ManaSymbol`, `RarityIcon`, `CardFaceTile`) unchanged.

**Consequences:** Remaining pages (detail, sets, search) still mix legacy zinc classes — migrate in follow-up waves. No light/dark toggle yet. **Superseded** for brand + theme mode by “Dark-only orange palette” (2026-07-16).

## 2026-07-16 — Dark-only orange palette

**Context:** Dual light/dark + violet primary felt generic; product direction is a single dark standard with a warmer brand that contrasts MTG card art without fighting it.

**Decision:**
- Force dark via `next-themes` `forcedTheme="dark"` + static `html.dark` (keep library for a future light mode)
- Single warm-dark OKLCH palette (hue ~50°) on both `:root` and `.dark` in `globals.css`
- Primary orange; layered surfaces (background → card → muted/accent) still relatively flat
- Semantic tokens `--warning` / `--info` for salt mid, alerts, and former violet notices
- Map salt badge, alert variants, stale banner, and dev chrome to tokens; bake former `dark:` shadcn overrides into the only theme

**Consequences:** No system theme switching. Nav/rank/CTA read orange. Reintroducing light mode later means restoring a light `:root` block and dropping `forcedTheme`.

## 2026-07-16 — Two-layer CSS palette (primitives → semantic)

**Context:** Semantic shadcn tokens repeated the same OKLCH values (brand, foreground, borders) in many places, so a brand tweak required multi-edit and no single “base swatch” list existed.

**Decision:**
- In `globals.css`, define unique `--palette-*` swatches once, then map `--primary`, `--background`, sidebar, chart, ring, etc. with `var()` / `color-mix`
- Keep layout / grid / sticky strings in existing `src/lib/ui/*` modules (already centralized); do not invent a parallel TS color file
- Document the two-layer model in `docs/UI.md` § Tokens

**Consequences:** Changing brand/orange or near-black is one `--palette-*` edit. Components stay on semantic Tailwind classes.

## 2026-07-16 — Cool neutrals + orange brand (break monochrome)

**Context:** After the dark-only orange pass, surfaces and brand shared hue ~50°, so the UI read as monochrome orange rather than “orange accent on a dark app”.

**Decision:** Keep `--palette-brand` orange (~50°). Shift backgrounds/cards/muted/foreground/hairline to cool low-chroma neutrals (~255°). Soft `--palette-accent` stays a low-chroma brand tint for hover. Move `--info` and chart-2 to teal (~200°). Warning/destructive unchanged.

**Consequences:** Primary/CTA/rank stay orange and pop against cool chrome. Sync/dev notices read teal, not brand. Supersedes the “everything hue 50°” surface choice from the dark-only orange entry.

## 2026-07-16 — Trial: lime brand primary

**Context:** Exploring brand accents on cool neutrals; user requested a lime/chartreuse primary trial.

**Decision:** Set `--palette-brand` / accent / brand-ink to hue ~130° (lime). Keep cool surfaces and teal info.

**Consequences:** CTA/nav/rank read lime. May feel closer to EDHREC green — revisit if too similar; orange/amber remain easy fallbacks.

## 2026-07-16 — Trial: amber brand primary

**Context:** Lime trial did not fully convince; next brand trial on cool neutrals.

**Decision:** Set `--palette-brand` / accent / brand-ink to hue ~75° (amber/gold). Keep cool surfaces and teal info. Supersedes the lime trial for the active primary.

**Consequences:** CTA/nav/rank read warmer gold than the earlier orange; sits close to `--warning` hue — watch salt/alert contrast; nudge brand or warning apart if they collide.

## 2026-07-14 — Browse layout closure (grid-only, search rows, sets grid)

**Context:** Phase 1.6 Wave 6–7 needed final layout choices for `/cards`, `/commanders`, `/search`, and `/sets` before marking the epic complete.

**Decision:** (1) **`/cards` and `/commanders`** — **grid-only**; no `BrowseViewToggle` wired (defer list mode to backlog). (2) **`/search`** — keep **compact horizontal rows** (`Card` + thumbnail), not `CardFaceTile` grid. (3) **`/sets` browse** — keep horizontal row card layout inside each item, but lay out items in **`SET_BROWSE_GRID_CLASS`** (1 → 2 → 3 columns). Set detail: filters in `PageShell` toolbar + `PageListMeta`.

**Consequences:** `BrowseViewToggle` component exists but unused. Sets filter toolbar keeps dense grid (`browseToolbarDenseGridClassName`). Phase 1.6 marked complete in roadmap; Phase 2 unblocked.

## 2026-07-16 — Browse sync health includes top_lists + EdhrecSyncNotice

**Context:** Post–Phase 1.6 audit: browse primary tabs read `edhrec_top_entries` (`top_lists` SyncLog job), but `getEdhrecSyncHealth()` only watched `commanders_hot` + `cards_hot`. Docs described `EdhrecSyncNotice` and `SYNC_CRON_SECRET` / `/api/sync/*`, neither of which existed; Actions run scripts with `DATABASE_URL` directly. Sync workflows stay disabled until intentionally enabled.

**Decision:**

1. Health watches **`commanders_hot`**, **`cards_hot`**, and **`top_lists`**. Stale if **any** watched job has no success within 8 days (or never); notice also on latest-run failure.
2. Ship **`EdhrecSyncNotice`** on `/cards` and `/commanders` layouts (neutral “Popularity data” copy; production-visible).
3. Weekly EDHREC workflow (when enabled) also runs **`sync:purge-edhrec-page-variants`**.
4. Remove aspirational `SYNC_CRON_SECRET` / `/api/sync` from `.env.example` and architecture docs.

**Consequences:** Browse notice can fire when HOT profiles look fine but the top index is stale. Enabling Actions later is still a manual ops step (`SYNC_JOBS_ENABLED` + secret + cron).

## 2026-07-16 — Remove Phase 1.5 leftover browse/search code

**Context:** Audit found unused discovery components after grid-only / `/catalog` split, plus orphan typeahead APIs superseded by `GET /api/search`.

**Decision:** Delete `BrowseTabs`, `BrowseViewToggle`, `CardBrowseRow`, `CommanderBrowseRow`, `EdhrecTopCards`, and routes `GET /api/cards/search` + `GET /api/commanders/search`. Keep list-mode toggle as a **backlog idea only** (recreate when needed). Refresh `docs/ARCHITECTURE.md` folder tree + API table to match `src/`.

**Consequences:** Global search is the only search API. Browse list rows are gone; grid tiles remain. Historical ROADMAP Phase 0.4 (`/api/cards/search`) stays as completed history.

## 2026-07-16 — Shared useBrowseList + split cards browse modules

**Context:** Audit P1: four client browse pages duplicated fetch/cursor/debounce state machines; `lib/browse/cards.ts` was ~719 LOC mixing filters, params, popular top-index, and catalog queries.

**Decision:** (1) Add `src/hooks/use-browse-list.ts` — `requestKey` + `buildSearchParams` + search debounce; wire `/cards`, `/commanders`, `/catalog`, `/sets`. (2) Split card browse into `cards-filters`, `cards-params`, `cards-popular`, `cards-catalog` with thin `cards.ts` facade (stable imports for API route + set filters).

**Consequences:** Browse pages only own toolbar/window UI state. Further query refactors (e.g. commanders) can follow the same split pattern.

## 2026-07-16 — Vitest for high-risk pure browse/EDHREC logic

**Context:** Audit P2: zero automated tests; browse cursor, slug resolution, and cardlists parsers are regression-prone and mostly pure.

**Decision:** Add **Vitest** (`npm test` / `npm run test:watch`), colocated `*.test.ts` under `src/`. Initial coverage: cursor encode/decode + list response paging, `parseCardBrowseParams`, `toEdhrecSlug` / layout exclusion, mocked `findPlayableCardByEdhrecSlug`, commander/card cardlists parsers. No E2E yet (Phase 5).

**Consequences:** CI can run `npm test` without DB. Expand coverage as Phase 2 grows; keep Prisma-heavy query tests for later or integration.

## 2026-07-16 — Indexes for sync health + browse sort columns

**Context:** Audit: `sync_logs` had no indexes despite frequent “latest success / health” queries; legacy popular sorts and catalog CMC filter lacked supporting indexes. Top-list browse still loads windows in memory — indexes help DB paths and purge/TTL, not that in-memory path.

**Decision:** Migration `20260716010000_browse_sync_indexes`:
- `sync_logs`: `(source, job_type, started_at)` and `(source, job_type, status, completed_at)`
- `cards`: `cmc`, `layout`
- `edhrec_card_data` / `edhrec_commander_profiles`: `inclusion`/`num_decks`/`salt` as applicable + `expires_at`
- `edhrec_page_variants`: `expires_at`

Defer GIN on `color_identity` / trigram on `type_line` until measured need. Next ops item: atomic top_entries rewrite.

**Consequences:** Apply with `npx prisma migrate deploy` (or `db:migrate` locally). Small write overhead on sync upserts; reads for health/legacy browse/purge improve.

## 2026-07-16 — Atomic edhrec_top_entries window replace

**Context:** `sync:edhrec-top-lists` used `deleteMany` then chunked `createMany` outside a transaction — browse could see an empty or partial window mid-sync (or after a crash mid-rewrite).

**Decision:** Wrap each `(entityType, window)` replace in `prisma.$transaction` (delete + chunked createMany, 10 min timeout). Postgres MVCC keeps prior committed rows visible to readers until commit. No staging table yet — revisit if transaction duration/locks become a problem on Neon.

**Consequences:** Failed sync leaves the previous window intact. Concurrent sync of the same window still serializes on row locks; weekly cron is single-job.

## 2026-07-16 — SSR hydrate for discovery browse lists

**Context:** Browse pages were fully client-fetched (`useBrowseList` → `/api/*`), causing loading flash and weak list HTML for crawlers. Query logic already lived in `lib/browse`.

**Decision:** Server `page.tsx` calls `query*Browse(prisma, defaults)` and passes `initialData` + `initialRequestKey` into a client browse component. `useBrowseList` skips the first fetch while `requestKey` matches the SSR key; filter/window changes and load-more still hit the API. Defaults live in `lib/browse/*-defaults.ts` (shared hydrate key).

**Consequences:** Default view (year / rank / etc.) is in the first HTML. TTFB includes the browse query (already heavy for top cards). Search-param-driven SSR of filtered views is backlog.

## 2026-07-16 — Audit closed; deferred follow-ups listed in ROADMAP

**Context:** Post–Phase 1.6 structural audit items Ops.1–10 done except enabling GH sync. Remaining risks were intentionally not fixed now.

**Decision:** Track deferred follow-ups in `docs/ROADMAP.md` § Ops hardening:
- **Ops.4** enable Actions when ready
- **Ops.11** GIN/trigram indexes only if measured need
- **Ops.12** safer classification rebuild + soft-FK review before Phase 3 depends on them
- E2E/Sentry stay Phase 5; product work is Phase 2+

**Consequences:** Future agents should not re-litigate “did we forget GIN/classifications?” — check that table. Do not implement Ops.11/12 preemptively.

## 2026-07-16 — Detail pages: no printed-card duplicate panels

**Context:** Card/commander detail main columns repeated CMC, colors, oracle text, and keywords already visible on the card image, while prices and popularity (not on the face) sat in those same panels.

**Decision:** Remove Stats / Popularity / Oracle / Keywords `DetailSectionPanel`s from detail main columns. Keep under the sticky image: set printing note, salt, all-time rank (commanders), **PriceChip** (Scryfall USD), and popularity (inclusion % / decks). Delete unused `CardStatsLine`.

**Consequences:** Shorter detail pages; hero aside is the sole place for non-face metadata. Browse list rows still show CMC/colors.

## 2026-07-16 — Browse filters use shadcn Input / Select / Label

**Context:** Filter toolbars used native `<input>` / `<select>` with hand-rolled chrome (`browseToolbarInputClassName`) while header search used shadcn `Input`. Installed `Select` was unused. UI felt inconsistent with the rest of the app.

**Decision:** Route all browse/detail filter fields through `BrowseSearchField` / `BrowseSelectField` / catalog CMC fields using shadcn `Input`, `Select`, and dense `Label`. Map empty-string “any/all” options to an internal sentinel (SelectItem cannot use `""`). Sort-order control uses `Button` (`outline` + `icon`). Mana/rarity pills stay domain-custom.

**Consequences:** One form language across header and filters. Follow-ups (Alert, ToggleGroup) remain optional.

## 2026-07-16 — EntityDetailTabs uses shadcn Tabs

**Context:** Card | Commander switch was custom `rounded-full` pills, inconsistent with the shadcn kit and with header nav.

**Decision:** Add `components/ui/tabs.tsx` (base-nova). `EntityDetailTabs` uses controlled `Tabs` + `TabsList variant="line"`; each trigger renders a Next `Link` (`nativeButton={false}`) so middle-click / open-in-new-tab still work, with `onValueChange` → `router.push` for keyboard activation.

**Consequences:** Detail route switch matches design-system tabs. No `TabsContent` — panels are separate routes. Superseded for EntityDetailTabs by the ToggleGroup entry below (`tabs.tsx` remains available).

## 2026-07-16 — EntityDetailTabs matches outline ToggleGroup

**Context:** Line `Tabs` on Card/Commander felt unlike other in-app view switches (Themes/Kindred, filter toggles).

**Decision:** Restyle `EntityDetailTabs` as outline `ToggleGroup` (`size="sm"`, `spacing={0}`, pressed → primary), same visual language as `EdhrecThemes`. Keep Next `Link` + `router.push` for navigation.

**Consequences:** Card ↔ Commander chrome matches the rest of discovery UI.

## 2026-07-16 — Alerts + ToggleGroup for remaining UI chrome

**Context:** After filter Input/Select and EntityDetailTabs, remaining mismatches were hand-rolled notice boxes and filter/theme pill buttons.

**Decision:**
- Add shadcn `Alert` (+ `warning` variant), `Toggle`, `ToggleGroup`
- Migrate `StaleCacheBanner`, `EdhrecSyncNotice`, `FilterUnavailableNotice` → `Alert`
- Mana/rarity filters → `ToggleGroup` (`multiple`); option pills → `Toggle`; themes/kindred switch → `ToggleGroup` (single); “Clear filters” → `Button`
- Fix toggle pressed styles to Base UI `data-pressed` / `aria-pressed` (not Radix `data-state=on`)

**Consequences:** Sort-order `Button` was already done with the filter pass. Domain icons (mana/rarity) stay custom inside ToggleGroup items.

## 2026-07-16 — Mobile-first header, filters, and detail chrome

**Context:** Mobile lacked a header menu and detail section jump; browse/detail filter panels were always fully expanded; detail TOC sat as a long list under a non-full-width image before content.

**Decision:**
- Add shadcn `Sheet`, `DropdownMenu`, `Collapsible`
- Header: `MobileNavSheet` hamburger (`lg:hidden`); desktop `NavLinks` unchanged
- Detail: image centered max 300px on mobile; vertical `DetailSectionNav` only at `lg+`; sticky `DetailSectionJump` (`DropdownMenu`) at top of main column on mobile

**Consequences:** Mobile navigation chrome in place. Later refined (filters always visible; sticky TOC-only; larger card grids) — see following entry.

## 2026-07-16 — Detail sticky TOC-only, always-visible filters, larger card grids

**Context:** Collapsed mobile filters hid useful controls; sticky whole-aside + hide-on-scroll meta was noisy; sticky nav sat under the sticky header; card grids were too dense (up to 6 columns).

**Decision:**
- Remove `BrowseFiltersShell` collapse — listing and detail filters always visible
- Detail hero image/meta are not sticky; only `DetailSectionNav` (desktop) and `DetailSectionJump` (mobile) stick
- `AppHeader` publishes `--site-header-height` via ResizeObserver; sticky offsets and `scroll-mt` use that variable
- `CARD_FACE_GRID_CLASS` → `2 / md:3 / xl:4` columns for browse + detail section grids

**Consequences:** Clearer scroll behavior under the header; larger card faces; filters always at hand on mobile.

## 2026-07-16 — Fix detail section TOC sticky containing block

**Context:** Desktop `DetailSectionNav` did not stick while scrolling. The aside wrapper used `self-start`, so the sticky containing block was only as tall as the card image column — sticky had nowhere to travel. The TOC also always used a forced scroll viewport.

**Decision:** Stretch the hero aside to the detail grid row height (`lg:h-full`, no `self-start`). Keep `max-h` under the header; list overflow is `overflow-y-auto` (scrollbar only when the TOC exceeds the viewport).

**Consequences:** TOC pins below the header after the image scrolls away; short TOCs do not show an inner scrollbar.

## 2026-07-16 — Unified card / commander preview footers

**Context:** Browse tiles, detail heroes, and EDHREC cardlist tiles each had ad hoc under-image meta (badges, popularity strings, partial footers). Prices only appeared on detail heroes. Supersedes the under-image meta shape from the 2026-07-15 “slim detail pages” decision.

**Decision:**
- One `EntityPreviewFooter` for browse tiles, EDHREC lists (`CardFaceMetricFooter`), and detail heroes (`DetailHeroAside.previewFooter`)
- Layout: prices ↔ salt (flex between); primary metric ↔ compact decks (`formatCompactCount`, e.g. 2.4k / 7.4M); synergy on its own row when provided
- Primary labels (`inclusion` / `rank`) match value size and color; rank caption precedes the value (`rank #42`), inclusion follows (`12.3% inclusion`)
- Plumb Scryfall `prices` into browse items and `loadCatalogCardFacesBySlugs`
- Commander-context list tiles pass synergy when present

**Consequences:** Same image+footer pattern on list, hero, and detail lists. `DetailHeroBadges` unused on hero (superseded). Similar commanders keep commander-style footer (prices · Rank · decks · salt). Similar cards enrich from `EdhrecCardData` + Scryfall prices for the same card-style footer (inclusion · decks · salt). Relatives / set tiles still use lighter meta.

## 2026-07-16 — Neon egress: paginated top browse + slim selects

**Context:** Neon Free 5 GB/month public network transfer exhausted. Root causes: (1) top-list browse loaded entire `edhrec_top_entries` windows (~30k rows) then `IN (...)` joins; (2) detail loaders `findUnique` without select returned fat `cardlists` JSON (sometimes twice per commander page); (3) sync `upsert` RETURNING full rows; (4) no SSR cache on default browse hydrate.

**Decision:**
1. **Browse:** SQL keyset pagination in `top-index-sql.ts` (JOIN + `LIMIT` + `COUNT`); remove production `loadTopEntryRows` full-window path
2. **Detail:** explicit selects in `detail-select.ts` / `cache.ts` / `variant-cache.ts`; commander page uses lite profile only when filters need unfiltered theme options
3. **Sync:** all hot upserts use `select: { id: true }` (or equivalent) so RETURNING is tiny
4. **Cache:** `unstable_cache` on default `/cards` and `/commanders` SSR (1h, tags `browse-cards-top` / `browse-commanders-top`)

**Consequences:** Default browse requests transfer page-sized results (~tens of KB) instead of multi-MB windows. Sync spikes drop sharply. Filtered/cursor API paths stay uncached. Local Postgres for dev remains recommended ops outside this change.

## 2026-07-20 — Remove EDHREC data dependency
**Context:** EDHREC ToS prohibit automated scraping/redistribution; partnership deferred. Community corpus not ready as meta substitute.
**Decision:** Remove all EDHREC sync, cache tables, and UI meta. Discovery is Scryfall catalog-first (`/cards`, `/commanders` browse catalog; detail shells without popularity). Rename `Card.edhrecSlug` → `Card.slug` (`toCardSlug`). `/catalog` redirects to `/cards`. Future discovery enrichment is Scryfall-only (workshop), not EDHREC.
**Consequences:** No salt/rank/synergy/top-list parity until Scryfall-based redesign. Phase 3 meta comparison must not target EDHREC profiles. Attribution footer is Scryfall + WotC only.
**Supersedes:** Decisions that treat EDHREC JSON as Tier-1 meta source and discovery parity vs EDHREC (2026-07-08 data sources; Phase 1–1.6 EDHREC cache decisions).

## 2026-07-20 — Scryfall discovery Phase B (hub + D2)
**Context:** After removing EDHREC, discovery needed Scryfall-native popularity and classification-driven detail without pretending community meta exists.
**Decision:** Single hub `/browse` with **Cards \| Commanders** toggle and rich facets (CI, CMC, type, Role, Theme, Game Changer, price band, Reserved). Redirect `/cards` → `/browse?entity=cards` and `/commanders` → `/browse?entity=commanders`; keep detail URLs. Ingest Scryfall `edhrec_rank` as **Popularity**, `game_changer`, reserved, mana/P/T/loyalty, and `all_parts` → `card_relations`. Persist **Friction** 0–3 (+2 GC, +1 stax-family otag, cap 3). Detail pack **D2**: hero Popularity/GC/Friction + role staples in CI + GC in CI + themes + similar (theme∩CI) + related + build skeleton (fixed targets; “available in CI”, not deck counts). Price bands labeled honestly (Low &lt;$1 / Mid $1–5 / High &gt;$5), not “budget meta”.
**Consequences:** Nav is **Browse · Sets**. No inclusion %, synergy %, average-deck, or time windows in v1. Popularity copy must stay Scryfall-rank clear. Re-run `sync:scryfall` then `sync:compute-classifications` to populate rank/GC/relations/friction.
**Supersedes:** Phase 1.7 “catalog shells without popularity” interim UX for browse/detail density.

## 2026-07-20 — Pivot to MTGPlayground (catalog + collection + multi-format)
**Context:** Without EDHREC/partnerships there is no legal Scryfall-like source for “as commander” popularity. Continuing as an EDHREC-style commander center would misrepresent `edhrec_rank` (deck inclusion, not commander choice). Product direction shifts toward Archidekt-like ownership tools.

**Decision:**
1. **Product name:** **MTGPlayground** (repo/package rename is a follow-up ops task; docs use the new name now).
2. **Positioning:** Catalog + personal collection + multi-format deck building; not an external meta commander center.
3. **Formats:** Deck builder supports **all major constructed formats** (not Commander-only). Commander remains a first-class format, not the sole scope.
4. **Printing-first site-wide:** Manage card **versions** everywhere (set, artwork/collector number, foil/nonfoil/etched) like Archidekt — not only in collection. Collection grain is **printing-level** (option B).
5. **Multiface:** First-class UI for DFC/MDFC/transform/split/etc. One physical printing / one deck oracle slot; render faces from Scryfall `card_faces`.
6. **Single card detail:** Remove parallel Card \| Commander detail routes/tabs. One oracle hub with version picker + face toggle. Former commander D2 blocks (roles, GC, friction, relations, staples/skeleton) are **deferred into deck-builder insights**, not a second “commander view”.
7. **Popularity:** Keep Scryfall inclusion rank on **cards** with honest copy; do **not** present it as commander popularity.
8. **Community:** Keep publish + multi-axis ratings + rankings from the original plan, refined for **multi-format** and based on **platform corpus only** (no scraped meta).
9. **Data sources:** Scryfall (oracle + printings sync) + MTGJSON (precons) + user collection/decks. No EDHREC/Moxfield/Archidekt scrape.

**Consequences:** Roadmap reorders around printings schema, collection, multi-format decks, then analysis/community. Browse commanders-as-meta hub is deprecated. Neon storage/sync cost rises when full printings are indexed. WotC Fan Content Policy + Scryfall rules still apply (no paywall on card data).
**Supersedes:** Commander-only MVP (2026-07-08); Phase 1.8 dual card/commander detail as product end-state; “commander center” discovery framing in PROJECT/AGENTS.

## 2026-07-20 — Package/UI rebrand to MTGPlayground (Phase 2.0.2)
**Context:** Docs already used MTGPlayground; UI, npm package name, and Scryfall User-Agents still said EDHForge.
**Decision:** Rename user-facing brand and `package.json` to **MTGPlayground** / `mtgplayground`. Update SEO defaults and Scryfall User-Agent to `MTGPlayground/1.0`. Leave GitHub repo URL and local folder as `edhforge` until a separate ops rename.
**Consequences:** No product behavior change. Historical decision entries keep the word EDHForge where they refer to the past.
**Supersedes:** Pivot note that package rename was entirely deferred (partially completed for package/UI).

## 2026-07-20 — Catalog honesty: Inclusion rank + commanders filter (Phase 2.0.3)
**Context:** Scryfall `edhrec_rank` is Commander **deck inclusion**, not “chosen as commander”. Sorting/labeling the commanders hub by “Popularity” implied a false meta ranking (e.g. staples outranking true popular commanders).
**Decision:** User-facing label **Inclusion** (tooltips explain deck inclusion). Keep sort param `popularity` for URL stability. **Commanders** browse defaults to **Name**, hides Inclusion on tiles/detail hero, and copy frames it as a legality catalog filter. Cards browse keeps Inclusion as default sort. Home demotes “Legal commanders” to secondary.
**Consequences:** Commanders hub is no longer a fake top-commanders list. Full dual-view removal remains Phase 2.0.4.
**Supersedes:** Phase 1.8 “Popularity” label as neutral-enough copy for commander browse.

## 2026-07-20 — Single card detail; commanders slug redirects (Phase 2.0.4)
**Context:** Pivot requires one oracle hub; Card \| Commander tabs duplicated D2 and implied a second “meta” product surface.
**Decision:** Canonical detail is **`/cards/{slug}`** only. Remove `EntityDetailTabs`. `/commanders/{slug}` **permanentRedirect**s to `/cards/{slug}` (preserve `?set=`). All in-app links (browse, search, sets, tiles) go to `/cards/…`. Show **Legal commander** chip when `isCommander`. Former commander-only D2 blocks (role staples in CI, GC in CI, build skeleton) stay out of detail — deferred to deck-builder insights (Phase 2.2). Sitemap lists `/cards/{slug}` only.
**Consequences:** Bookmarks to `/commanders/{slug}` still work via redirect. Browse `entity=commanders` remains a legality filter, not a parallel detail world.
**Supersedes:** Symmetric EntityDetailTabs (2026-07-10 / 2026-07-16); parallel `/commanders/{slug}` detail as product surface.

## 2026-07-20 — Show Inclusion on commanders browse tiles
**Context:** After 2.0.3 hid Inclusion on commanders browse, the hub already states that commanders is a legality filter and Inclusion is not “as commander” popularity.
**Decision:** Show **Inclusion** again on commanders browse tiles (same label/tooltip as cards). Keep name-first default sort and hub disclaimer.
**Consequences:** Users can compare inclusion while filtering legal commanders without implying a commander-choice meta ranking.
**Supersedes:** “hides Inclusion on tiles” clause of Catalog honesty (Phase 2.0.3).

## 2026-07-20 — Printings table + default_cards bulk (Phase 2.0.5)
**Context:** `set_cards` unique `(set, oracle)` collapsed multiple arts/CNs per set and lacked finishes, faces, and per-printing prices — insufficient for printing-first collection.
**Decision:** Replace `set_cards` with **`printings`**: PK = Scryfall card id; unique `(set_code, collector_number)`; fields include `finishes[]`, `faces` Json, `prices` Json, `image_uri`. Sync from Scryfall bulk **`default_cards`** (`sync:scryfall-printings`), skipping `art_series` and rows whose set is not in `mtg_sets`. Soft-join to oracle via `oracle_id`. Hero `?set=` picks lowest collector number in that set until 2.0.7 adds `?cn=`.
**Consequences:** Set detail can list multiple printings of the same oracle. Neon storage/sync cost rises vs the old search index. Version picker UI and multiface UI remain 2.0.6–2.0.7. Alias `sync:scryfall-set-cards` → printings script for old docs/workflows.
**Supersedes:** 2026-07-09 `set_cards` + per-set `unique=cards` search index as the printing model.

## 2026-07-20 — Multiface Flip UI (Phase 2.0.6)
**Context:** Printings already store `faces` Json; tiles/detail only showed the front `imageUri`.
**Decision:** Add `cards.faces` (backfilled from printings; oracle sync writes faces going forward). Shared `CardMultifaceImage`: **staggered front/back stack** (no Flip button). Hovering the back face (visible offset) raises it to the front until hover leaves. Wire into detail hero, browse/set `CardFaceTile`, similar/relatives grids.
**Consequences:** DFC/MDFC/transform cards show both faces at a glance. Version picker (set/cn/foil) remains 2.0.7.
**Supersedes:** “multiface UI remains 2.0.6” deferral in the printings decision.

## 2026-07-20 — Version picker `?set=&cn=&finish=` (Phase 2.0.7)
**Context:** Printing-first catalog needed a stable way to deep-link a concrete art/CN and finish before collection (2.1).
**Decision:** Card detail exposes **VersionPicker** (select of oracle printings + finish toggle). URL contract: `?set={code}&cn={collector}&finish={foil|etched}`; omit `finish` for nonfoil; “Catalog default” clears params. Resolve via `resolveCardPrinting` (set-only → lowest CN). Set detail and `/commanders/{slug}` redirects use `buildCardVersionHref`. Prices in hero footer prefer foil/etched when selected.
**Consequences:** Shareable printing URLs without auth. Collection items (2.1) can reuse the same set/cn/finish grain.
**Supersedes:** “`?cn=` lands in 2.0.7” deferral in the printings decision (2.0.5).

## 2026-07-20 — Drop Related parts / `card_relations`
**Context:** Scryfall `all_parts` (tokens, meld, combo pieces) on card PDP added little discovery value vs similar + relatives-by-subtype, while costing sync + storage.
**Decision:** Remove `RelatedPartsSection`, `getCardRelations`, oracle sync relation upserts, and drop `card_relations` + `CardRelationComponent` from schema.
**Consequences:** Slimmer oracle sync; PDP sections are classifications / similar / relatives-by-subtype only. Token/meld discovery is out of scope unless revisited later.
**Supersedes:** `all_parts` → `card_relations` clause of the Phase 1.8 discovery decision (2026-07-20).

## 2026-07-20 — Catalog prices EUR-first (Scryfall / Cardmarket)
**Context:** EU-first product was showing only Scryfall USD while `prices.eur` / `eur_foil` (Cardmarket via Scryfall) were already synced on cards and printings. A direct Cardmarket export sync was deferred as low ROI.
**Decision:** Default catalog currency is **EUR**. `PriceChip`, price sort, and price bands (`< €1` / `€1–5` / `> €5`) read `prices.eur*`. Display falls back to USD only when EUR is missing. No Cardmarket API/export job for now.
**Consequences:** Honest EU pricing without new sync. Bands exclude cards with no EUR. Direct Cardmarket export remains optional later for Low/Trend/AVG fields or buy links.
**Supersedes:** USD-only price chip / “Low &lt;$1” band wording from Phase 1.8.

## 2026-07-20 — Global search: single Cards section
**Context:** After unified `/cards/{slug}` detail, navbar search still split **Commanders** vs **Cards**, duplicating legendaries and implying parallel entity types.
**Decision:** `GET /api/search` returns one `cards[]` (plus `sets[]`). Legal commanders stay in that list with `isCommander` → UI label **Legal commander**. Remove the separate `commanders[]` bucket.
**Consequences:** One hit per oracle; search matches detail/browse honesty. Browse hub `entity=commanders` remains a legality filter, not a search taxonomy.
**Supersedes:** dual card/commander sections in global search (Phase 1.5.5).

## 2026-07-21 — Catalog default printing pre-selected + foil sheen
**Context:** VersionPicker showed a synthetic “Catalog default” row while the hero used oracle image/faces without set/cn, so the select did not highlight the real printing. Foil/etched finishes shared Scryfall’s nonfoil art URI, so the hero looked identical.
**Decision:** `resolveCardPrinting` with no `?set=` resolves the catalog representative via `cards.id` → `printings.id` (fallback: matching `image_uri` on the oracle) and returns that printing’s set/cn/finishes. VersionPicker drops the “Catalog default” option and selects that printing. Hero applies a CSS foil/etched sheen overlay when finish is foil or etched (Scryfall does not ship separate foil images).
**Consequences:** Bare `/cards/{slug}` URLs stay canonical; picker always shows a concrete set/#. Finish toggle works on the default printing. Foil uses Archidekt-style prismatic color-dodge + glare (visual cue only — same Scryfall art URI).
**Supersedes:** “Catalog default” clears params / synthetic select row in the 2026-07-20 version-picker decision (2.0.7).

## 2026-07-21 — Dynamic set types + hide-empty Role/Theme
**Context:** Sets browse used a hardcoded subset of Scryfall `set_type` values that could miss types present in `mtg_sets` or list empty ones. Role/Theme selects listed the full product enums even when no classified card used a value (zero-result clicks). Opening Role/Theme to raw Tagger tags would break the closed taxonomy Phase 3 depends on.
**Decision:** (1) Sets type select = `DISTINCT set_type` from `mtg_sets` via `listDistinctSetTypes` + `buildSetTypeFilterOptions`. (2) Browse Role/Theme options = enum ∩ values present in `card_classifications` (`listPresentClassificationFacets` + `buildRoleFilterOptions` / `buildThemeFilterOptions`); keep current selection; fall back to full enum when classifications are empty. Price bands, colors, rarity, sort stay static. Taxonomy expansion remains a separate product change to enums + maps.
**Consequences:** Sets filter tracks sync. Role/Theme stay a closed contract with fewer empty picks. No raw-otag facet soup.
**Supersedes:** hardcoded `SET_BROWSE_TYPE_OPTIONS` list for sets browse.

## 2026-07-21 — Card preview tilt is CSS 3D, not Three.js
**Context:** Wanted Archidekt-style perspective tilt on card previews (detail + browse grids). Three.js / R3F was considered for “real 3D”.
**Decision:** Implement **CSS `perspective` + `rotateX/Y`** via `CardTilt` (pointer-normalized; DOM transform refs; no React re-render per move). Wire through `CardMultifaceImage` for `detail` + `grid` only (thumbnails off). Foil glare follows `--pointer-x` while tilting; idle CSS animation otherwise. Skip touch continuous tilt and `prefers-reduced-motion`. No Three.js / `card-foil` dependency.
**Consequences:** Typical TCG hover look without WebGL cost on 24–48 tile grids. Future detail-only “vetrina” (mesh thickness / holofoil shaders) could revisit R3F lazy on the hero only — out of scope here.
**Supersedes:** nothing (new surface).

## 2026-07-21 — Search results use browse/set grids
**Context:** `/search` still used compact horizontal rows while `/browse` and `/sets` used face tiles / set rows — inconsistent discovery chrome.
**Decision:** `/search` renders cards with `CardGridTile` + `CARD_FACE_GRID_CLASS` and sets with `SetBrowseRow` + `SET_BROWSE_GRID_CLASS`. Expand `GET /api/search` payloads with browse-compatible fields (faces, prices, inclusion/friction, set counts). Navbar typeahead stays compact rows.
**Consequences:** One visual language for list discovery; search API slightly heavier selects.
**Supersedes:** “`/search` keep compact horizontal rows” clause of the 2026-07-16 Wave 6–7 layout decision.

## 2026-07-21 — Full-tile hits + cursor-pointer on controls
**Context:** Set browse rows only linked the title; card tiles linked the image but not the footer. Filter toggles / selects often lacked a hand cursor.
**Decision:** Wrap set browse rows (`SetBrowseRow`) in one full-surface `Link`. Card tiles keep the link on the face image only (`CardMultifaceImage` via `CardFaceTile`) — footer is not part of the hit target. Add `cursor-pointer` to shared `Button`, `Toggle`, `SelectTrigger`/`SelectItem`, and dropdown menu items.
**Consequences:** Larger set-row hits; card tiles stay face-only for clearer separation from metrics. Nested multi-action cards (if added later) must not use full-tile links.
**Supersedes:** nothing (UX consistency pass).

## 2026-07-21 — Browse Commander is an Options filter, not a tab
**Context:** Hub `/browse` used a **Cards \| Commanders** entity tab that felt like a second catalog mode. Users want one catalog with a filter for legal commanders.
**Decision:** Remove the entity tab. Add a **Commander** Options pill last (after Game Changer / Reserved) that sets `commanders_only` → `isCommander` (+ `require_slug`). SSR/home/redirects use `/browse?commanders_only=true`; legacy `?entity=commanders` still maps. Toggling resets sort (Name when on, Inclusion default when off).
**Consequences:** One browse chrome; commander list is a filter, not a parallel hub. API keeps `entity` parsing for back-compat only.
**Supersedes:** “Cards \| Commanders toggle” / `entity=cards|commanders` hub UX in the 2026-07-20 Scryfall discovery Phase B decision.

## 2026-07-21 — Format legality select (replaces Commander legal pill)
**Context:** Multi-format decks (Phase 2.2) need catalog filtering by Scryfall legality, not only “Commander legal”. The old Options pill covered only `legalities.commander`. `isCommander` (can be your commander) stays a separate Options pill.
**Decision:** Add a curated **Format** select (`src/lib/formats/scryfall-formats.ts`) on `/browse` and set detail. API param `format=<key>` filters `cards.legalities` JSONB path equals `"legal"` (whitelist keys only). Legacy `commander=legal` maps to `format=commander`. v1 does not expose restricted/banned. No schema change — reuse existing sync field. Shared format list is the seed for Deck.format later.
**Consequences:** Users can browse Modern/Pioneer/etc. legal cards. Commander Options pill remains `isCommander`. Set detail drops the Commander legal pill. JSONB path filter has no dedicated index yet (acceptable for v1; revisit near 2.2.3 if slow).
**Supersedes:** “Commander legal” Options pill as the only format-legality control (browse kit decision 2026-07-16 / hub Phase B).

## 2026-07-21 — Inclusion clarity + Color & CMC default sort
**Context:** Inclusion is Scryfall Commander deck inclusion (`edhrec_rank`). Showing it as the default sort (and on tiles) for Modern/Pioneer/etc. implies format-agnostic popularity. Arena-like browse expects color then mana value.
**Decision:** (1) Sort label **Inclusion (Commander)**; strengthen footer tooltip; hide Inclusion on browse tiles when Format is set and not Commander **unless** sort is Inclusion. (2) Default sort = Inclusion only for Format Any/Commander; otherwise **Color & CMC** (`sort=color`). Options Commander still defaults to Name. (3) Denormalize `cards.color_sort` (WUBRG mono → multicolor bitmask → colorless) at sync + migration backfill for keyset pagination (`computeColorSortKey`).
**Consequences:** Constructed format browse feels Arena-like; EDH signal stays honest. Requires `prisma migrate` for `color_sort` before color sort works in prod.
**Supersedes:** unconditional Inclusion default sort for all catalog browse (Phase B popularity-as-default).

## 2026-07-21 — Drop browse price band filter
**Context:** Browse shows Scryfall oracle representative art/prices, not the cheapest or most expensive printing among versions. Filtering by Low/Mid/High on that price misleads users about real market range.
**Decision:** Remove the **Price band** facet from `/browse` (UI, API parse, SQL band resolver). Keep per-tile **PriceChip** and optional **sort by price** (still representative EUR). Printing-aware price filters deferred until collection/deck flows need them.
**Consequences:** No more `price_band` / legacy `budget` browse params. Honest catalog facets only.
**Supersedes:** price band as a Phase B browse facet (2026-07-20 discovery decision).

## 2026-07-21 — Card text search (name + type + oracle) via FTS
**Context:** Browse and header search were name-only. Users expect Scryfall-like matches on type line and rules text (`destroy`, `elf`, `instant`). Raw `ILIKE` on `oracle_text` without an index would hurt browse `COUNT` + keystroke queries.
**Decision:** Add `cards.search_document` (oracle + face texts) and DB-generated weighted `search_tsv` (name A, type_line B, document C) with GIN. Browse `q` and `GET /api/search` use the same `plainto_tsquery` helper. Sync fills `search_document` including DFC face text. Placeholders: “Search name, type, or text…”. No fuzzy/typo tolerance in v1; Type contains stays a separate filter.
**Consequences:** `destroy` / `elf` style queries work on browse + header. Requires migration + optional re-sync for freshest face corpus (backfill covers existing rows). Closes Ops.11 for text search.
**Supersedes:** name-only `q` matching in browse/global search; Ops.11 “defer GIN until measured” for this use case.

## 2026-07-21 — Hybrid FTS: phrase for multi-word queries
**Context:** `plainto_tsquery` AND-ed tokens anywhere (and drops stopwords like `all`), so `destroy all creature` matched “Destroy target creature”.
**Decision:** Hybrid mode — **1 token** → `plainto_tsquery`; **≥2 tokens** → `phraseto_tsquery` (adjacent phrase after stemming). No silent fallback to bag-of-words when phrase yields zero hits. Same helper for browse + global search.
**Consequences:** Multi-word searches behave like phrase/keyword sequences; single-word discovery stays broad. Users wanting OR/AND-anywhere must use separate single-token searches for now.
**Supersedes:** unconditional `plainto_tsquery` for all `q` lengths in the 2026-07-21 card text search decision.

## 2026-07-21 — FTS last-token prefix (partial words)
**Context:** `phraseto_tsquery` requires complete lexemes, so `destroy all creatu` and `day of judgmen` returned zero hits while full words worked.
**Decision:** Build queries with `to_tsquery('english', …)`: multi-word = `t1 <-> t2 <-> … <-> tN:*`; single-word = `t:*`. Prefix on the final token enables progressive typing without reopening bag-of-words AND-anywhere.
**Consequences:** Partial last words match stems (`creatu:*` → creatures; `judgmen:*` → Judgment). Middle tokens still need to be complete enough to survive stemming/stopwords. Not character-level fuzzy inside a token.
**Supersedes:** bare `phraseto_tsquery` / `plainto_tsquery` hybrid from the previous 2026-07-21 hybrid FTS decision.

## 2026-07-21 — Card detail two-band + As card / As commander lists
**Context:** Unified `/cards/{slug}` (2.0.4) was too slim: overview mixed with lists, and commander-oriented D2 sections were deferred entirely to the deck builder. Users still want card-first focus plus the former D2 list pack when the oracle is a legal commander — without restoring parallel `/commanders/{slug}` PDPs.
**Decision:** (1) **Two bands** — overview (image / version / finish / price + meta / roles / themes) then lists. Sticky TOC lives in the lists band, not under the image. (2) When `isCommander`, **As card | As commander** ToggleGroup switches packs via `?view=commander` (default = card); preserve `set`/`cn`/`finish`. Non-commanders get card lists only (no toggle). (3) **As card** = Similar + Relatives. **As commander** = Role staples · GC in CI · Build skeleton (existing `detail-pack` helpers; Similar/Relatives stay card-view only). (4) Keep single oracle URL; `/commanders/{slug}` redirect unchanged.
**Consequences:** Commander list insights return on the detail hub without dual routes. Phase 2.2.6 still reuses the same helpers in the deck builder.
**Supersedes:** “Former commander-only D2 blocks stay out of detail — deferred to deck-builder only” clause of the 2026-07-20 Phase 2.0.4 decision (partial). Does **not** restore `EntityDetailTabs` / parallel commander detail routes.

## 2026-07-22 — Show all versions sheet on card detail
**Context:** The Version select lists set/cn labels only; users need art + price previews when an oracle has many printings, without leaving the detail URL contract.
**Decision:** Add **Show all versions** (when `printings.length > 1`) opening a bottom Sheet (~85dvh) with a browse-like `CardFaceTile` grid. Enrich `listOraclePrintings` with `prices` + `faces` (no second fetch). One tile per printing (`set`+`cn`); Finish remains on VersionPicker. Tile click uses `buildCardVersionHref` (preserve finish when supported + `view`) and closes the sheet.
**Consequences:** Visual version browsing stays on `/cards/{slug}`; select stays for quick jumps. Slightly larger SSR payload for printings JSON.
**Supersedes:** nothing (enhancement of Phase 2.0.7 VersionPicker UX).

## 2026-07-22 — Workspace overlays vs catalog PDP (deck context)
**Context:** Archidekt keeps search + card inspect as contextual layers over the deck editor so brew state is not lost. MTGPlayground is catalog-first today: almost every card open is a full navigation to `/cards/{slug}`, which would break a live deck editor.
**Decision:** Hybrid model. (1) **Catalog mode** keeps the full public PDP at `/cards/{slug}` (overview + lists, SEO/share). (2) **Workspace mode** (Phase 2.2 editor, later collection if needed) uses **contextual overlays** — search-with-Add and CardPeek — that mutate workspace state without leaving the page; peek includes “Open full page” escape hatch. (3) `VersionPicker` / `VersionsBrowser` support **`onSelectPrinting` callback mode** for embeds; default remains URL navigate on the PDP. (4) Prefer explicit React-controlled Sheets over Next intercepted routes for v1.
**Consequences:** Deck building can follow Archidekt’s continuous loop without abandoning printing-first catalog hubs. Building blocks land ahead of the editor shell (`WorkspaceSearchOverlay`, `CardPeekSheet`, picker callbacks); wire when 2.2.2 lands. Do not convert browse to overlay-only.
**Supersedes:** nothing (complements 2.0.4 single PDP; scopes how 2.2 consumes it).
