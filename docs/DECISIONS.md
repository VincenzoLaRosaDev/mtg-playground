# EDHForge — Decision Log

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

**Consequences:** Remaining pages (detail, sets, search) still mix legacy zinc classes — migrate in follow-up waves. No light/dark toggle yet.

## 2026-07-14 — Browse layout closure (grid-only, search rows, sets grid)

**Context:** Phase 1.6 Wave 6–7 needed final layout choices for `/cards`, `/commanders`, `/search`, and `/sets` before marking the epic complete.

**Decision:** (1) **`/cards` and `/commanders`** — **grid-only**; no `BrowseViewToggle` wired (defer list mode to backlog). (2) **`/search`** — keep **compact horizontal rows** (`Card` + thumbnail), not `CardFaceTile` grid. (3) **`/sets` browse** — keep horizontal row card layout inside each item, but lay out items in **`SET_BROWSE_GRID_CLASS`** (1 → 2 → 3 columns). Set detail: filters in `PageShell` toolbar + `PageListMeta`.

**Consequences:** `BrowseViewToggle` component exists but unused. Sets filter toolbar keeps dense grid (`browseToolbarDenseGridClassName`). Phase 1.6 marked complete in roadmap; Phase 2 unblocked.
