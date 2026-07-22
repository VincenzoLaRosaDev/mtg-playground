# MTGPlayground — Product Specification

> Last updated: 2026-07-20 · **Pivot** from EDHForge commander-center → catalog + collection + multi-format decks  
> Package/UI: MTGPlayground · local folder / GitHub may still be `edhforge` until rename ops.

## Vision

**MTGPlayground** is an Archidekt-like Magic platform:

1. **Catalog** — Scryfall-backed cards, sets, and precons; **printing-first** (set, art, foil) with multiface support
2. **Collection** — personal inventory at **printing level** (qty + finish)
3. **Decks** — multi-format builder with legality, owned/missing vs collection
4. **Community** — publish immutable deck snapshots, multi-axis ratings, rankings (platform corpus only; multi-format)

**Not in scope as a product promise:** scraped EDHREC/Moxfield/Archidekt meta, “as commander” popularity from third parties, or pretending Scryfall `edhrec_rank` is commander-choice rank.

**Competitive angle:** honest catalog + ownership (collection) + multi-format deck tools on data you can legally cache (Scryfall + MTGJSON + user data).

## Constraints (MVP)

| Constraint | Value |
|---|---|
| Brand | MTGPlayground (EN UI) |
| Formats (decks) | Multi-format constructed (Commander, Standard, Modern, … as legality data allows) |
| Language | English (UI, DB, enums) |
| Data sources | Scryfall (oracle + printings), MTGJSON (precons); **no** EDHREC/meta scrape |
| Card model | **Printing-first** site-wide; oracle for identity/legalities/analysis |
| Collection grain | Printing-level (set + collector # + finish) |
| Multiface | First-class (DFC/MDFC/transform/split/…); one printing = one physical card |
| Card detail | **Single** oracle detail page + version picker (no Card \| Commander dual views) |
| Comments / follow | Not in MVP → later |
| Premium tier | Designed later; free tier limits apply in MVP |
| Card data paywall | Forbidden (Scryfall Fan Content Policy) |

## Core entities

### Oracle vs Printing

- **OracleCard** — identity: name, oracle text, color identity, legalities, keywords, classifications (roles/themes), friction/GC flags, popularity *inclusion* rank
- **Printing** — concrete version: set, collector number, rarity, images (incl. faces), finishes available, prices; Scryfall printing id
- **CollectionItem** — user + printing + finish + quantity (+ optional wantlist flag)
- **Deck / DeckCard** — format + list by **oracle** (legality); optional preferred printing for display; owned qty = sum of collection printings for that oracle

### Deck (private workspace)

- Editable, unlimited revisions
- Owner only
- Format field (Commander, Standard, …)
- Import: Arena paste, manual editor, fork, precon
- Commander/Partner fields when format requires them

### DeckPublication (public snapshot)

- Immutable after publish — votes attach here
- Multi-format; tags refined beyond Commander-only (e.g. Optimized, Budget, + format-aware tags later)
- Snapshot of decklist + metadata

### Relationships

```
User 1──* CollectionItem ──* Printing ──* OracleCard
User 1──* Deck
Deck *──* DeckCard ──* OracleCard  (optional preferred Printing)
User 1──* DeckPublication
Deck 1──* DeckPublication
PublicationRating: 1 per user per publication (power, budget, originality 1–10)
```

### User limits (MVP — provisional)

| Resource | Limit |
|---|---|
| Private decks | 50 |
| Collection distinct printings | TBD (high; e.g. 10k+) |
| Active publications | 20 |
| Total publications (incl. retired) | 100 |
| Cards per decklist | format-aware soft rules + hard cap (e.g. 250) |

## Feature list

### MVP (post-pivot order)

**Catalog (public)**

- Search + browse cards (facets); sets; precons (when MTGJSON lands)
- Card detail: oracle hub + **version picker** (set/art/foil) + multiface toggle
- Popularity shown only as Scryfall **Inclusion** rank (honest copy), not commander popularity; commanders hub is a legality filter (name-first)
- Deprecated: dual `/commanders/[slug]` meta detail as a product surface (redirect/merge into card detail)

**Collection (auth)**

- Add/remove printings; qty; finish
- Import (CSV / paste — printing resolution UX)
- Owned vs wantlist

**Decks (auth to save)**

- Multi-format editor + legality
- Owned / missing vs collection (oracle aggregation)
- Arena paste import
- Insights from classifications (roles, GC, friction, relations) **inside builder**, not as a second detail mode
- Card inspect / catalog search **in the editor** use contextual overlays (`CardPeekSheet`, `WorkspaceSearchOverlay`); full `/cards/{slug}` remains the public catalog hub

**Community (after collection + decks work)**

- Publish immutable snapshots
- Multi-axis ratings; rankings (global / per format / per commander-or-archetype as applicable)
- Public profiles

### Later

- Comments, follow, notifications
- Deeper analysis vs precon / own corpus
- URL import from other builders **only** with ToS-safe methods or partnerships
- Premium limits
- Repo/GitHub folder rename `edhforge` → `mtgplayground` (package/UI done in 2.0.2)

## Discovery note (Phase 1.x legacy)

Phases 1–1.8 built an EDHForge commander-oriented discovery UI (including `/browse` Cards\|Commanders). Dual Card\|Commander detail was removed in Phase **2.0.4** (`/commanders/{slug}` → `/cards/{slug}`). Browse commanders remains a legality filter only.

Historical sections below (1.5 / 1.6 / 1.8) remain for archive; they do **not** define the current end-state.

---

## Discovery Scryfall (Phase 1.8) — archive

> **Superseded as product end-state by MTGPlayground pivot (2026-07-20).** Technical enrichment (popularity_rank, GC, friction, relations) remains useful on oracle cards.

### Browse hub (`/browse`) — legacy

- Toggle Cards \| Commanders; Popularity = Scryfall inclusion rank
- Facets: CI, CMC, type, Role, Theme, Format, GC, Reserved, Commander

### Naming

| UI term | Meaning |
|---|---|
| **Popularity** | Scryfall `edhrec_rank` — Commander **deck inclusion**, not “as commander” |
| **Friction** | 0–3: +2 GC, +1 stax-family otag |

### Detail pack (D2) — commander list view on card detail

Role staples / GC in CI / build skeleton live under **As commander** on `/cards/{slug}?view=commander` when `isCommander`. Dual `/commanders/{slug}` routes stay retired. Same helpers may still feed deck-builder insights (Phase 2.2.6).

---

## Discovery consistency (Phase 1.5) — archive

> Historical EDHREC-era behaviour. Superseded by 1.7 removal + 1.8 + MTGPlayground pivot.

*(See git history / older docs for full 1.5–1.6 EDHREC parity text if needed; not repeated here to avoid conflicting product truth.)*
