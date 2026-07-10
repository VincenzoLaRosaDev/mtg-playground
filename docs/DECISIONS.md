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
