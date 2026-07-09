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
