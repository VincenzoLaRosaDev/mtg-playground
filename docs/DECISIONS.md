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
