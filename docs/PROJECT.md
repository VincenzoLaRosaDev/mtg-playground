# EDHForge — Product Specification

> Last updated: 2026-07-14 · Phase 1.6 complete → Phase 2 (deck builder)

## Vision

Commander-first platform combining:

1. **Discovery** (EDHREC-like) — search cards, commanders, sets, precons; card/commander pages with synergies, staples, salt
2. **Tools** — live deck editor, deep analysis, meta comparison vs EDHREC
3. **Community** — publish immutable deck snapshots, multi-axis ratings, weekly rankings

**Competitive angle:** richer analysis + community on top of the same data sources EDHREC uses, with a proper deck editor.

## Constraints (MVP)

| Constraint | Value |
|---|---|
| Format | Commander only |
| Language | English (UI, DB, enums) |
| Commander rules | Single commander + simple Partner; Background/Doctor/Companion → V2 |
| Comments | Not in MVP → V2 |
| Follow users | Not in MVP → V2 |
| Sideboard | Optional in parser; Commander decks have no sideboard |
| Premium tier | Designed for V2; free tier limits apply in MVP |

## Core entities

### Deck (private workspace)

- Editable, unlimited revisions
- Owner only
- Import: Arena paste, manual editor, fork, precon (Phase 5)
- Fields: name, description, commander, main deck, strategic_intent, archetype tags (taxonomy + free), power_level_declared (1–10), budget_estimate, brewer_notes

### DeckPublication (public snapshot)

- **Immutable** after publish — votes/comments attach here
- To change: edit private Deck → new Publication; optionally retire/delete old
- Fields: title, public_description, publish_tag (OPTIMIZED | BUDGET), snapshot of decklist + metadata + computed salt/themes
- Retire = hidden completely; hard delete cascades votes

### Relationships

```
User 1──* Deck
User 1──* DeckPublication
Deck 1──* DeckPublication   (same workspace, multiple publishes over time)
DeckPublication *──* Card   (via PublicationCard, frozen)
Deck *──* Card              (via DeckCard, editable)
PublicationRating: 1 per user per publication (power, budget, originality 1–10)
```

### User limits (MVP)

| Resource | Limit |
|---|---|
| Private decks | 50 |
| Active publications | 20 |
| Total publications (incl. retired) | 100 |
| Cards per decklist | 250 hard cap |

## Feature list

### MVP

**Discovery (public, no login)**

- **Global search** (navbar): cards + commanders (+ sets in results); dedupe by `edhrec_slug`
- **Browse** with default lists, sort, filters, and pagination (not search-only empty states)
- **Card page** (`/cards/{slug}`): oracle canonical; commander meta via tab when applicable
- **Commander page** (`/commanders/{slug}`): parallel route; cross-link to card view
- **Set page**: card list with filters; links to card detail preserve set printing context (`?set=`)
- Card page sections: oracle, EDHREC (top commanders, synergy when built), relatives by subtype
- Commander page sections: rank, salt, themes, top cards, similar commanders

See [Discovery consistency (Phase 1.5)](#discovery-consistency-phase-15) for browse/search/detail behaviour.

**Deck workspace (auth required to save)**

- Live editor with Scryfall autocomplete (local DB, no live API)
- Arena paste import with merge-duplicates warning + partial import error report
- Legality engine: 100 singleton, ban list, color identity, commander + Partner
- Fork from own or others' publications

**Analysis (registered; guest gets subset)**

| Feature | Guest | Registered |
|---|---|---|
| Mana curve, types, land analysis | ✅ | ✅ |
| Color pip / production | ✅ | ✅ |
| Functional counts (removal, ramp, draw, etc.) | ❌ | ✅ |
| Contextual judgment vs EDHREC | ❌ | ✅ |
| Synergies (14 themes, card + deck level) | ❌ | ✅ |
| Commander coherence alerts | ❌ | ✅ |
| Meta Comparison section | ❌ | ✅ |
| Save deck | ❌ | ✅ |

**Meta comparison (registered)** — vs EDHREC profile for selected commander:

Priority order: (a) mana curve, (c) functional roles, (b) staples missing, (e) commander popularity, (d) theme overlap. No win rate in MVP.

**Community (auth required)**

- Auth: email/password + Google + Discord
- Publish → immutable snapshot
- Tags: Optimized, Budget
- Rating: Power, Budget, Originality (1–10 each); 1 vote/user/publication
- Show brewer self-declared power vs community average
- Rankings: global, per commander, per theme — weekly (rolling 7d) + all-time
- Ranking sort: bayesian average, min 3 votes to enter
- Public profile: username, display_name, avatar, bio, publications
- Report content (minimal moderation)
- Salt score on publications (from EDHREC card salt, averaged)

### V2

- Comments on publications
- Follow users + notifications
- Publish tags: Precon Upgrade, Themed/Flavor, CEDH
- Gap analysis (enabler/payoff imbalance)
- Export report (PDF/image/link)
- URL import (Moxfield/Archidekt)
- Premium tier (billing + higher limits)
- Commander: Background, Doctor, Companion
- ML: clustering for archetype inference; supervised ratings prediction
- Other formats (if product expands)

### Nice-to-have

- UI translations, LLM deck descriptions, deck diff, API pubblica, similar commanders page
- **Card Printings tab** on detail page — all reprints/arts per oracle (see [Printing context](#printing-context-set--future-printings-tab))

## Discovery consistency (Phase 1.5)

**Goal:** One coherent mental model before visual polish. Oracle card is the canonical entity; EDHREC meta and set printings attach to it.

### Canonical identity

| Concept | Key | Canonical URL |
|---|---|---|
| Oracle card | `cards.edhrec_slug` (or `oracle_id` internally) | `/cards/{slug}` |
| Commander meta | same slug when card is a commander | `/commanders/{slug}` **parallel** |
| Set printing | `set_cards` row (oracle + set + collector #) | context via `?set={code}` on card URL |

**Catalog scope:** Scryfall `art_series` layouts are **excluded** (not playable; caused slug collisions). All browse/search/detail uses playable catalog rows only.

**Slug rule:** one name → one `edhrec_slug` on the oracle row. Commander and card share the slug when the card is commander-legal. When multiple oracle rows share a slug, resolution prefers the commander-legal playable card.

### Global search (navbar)

Primary entry point for “find a card/commander”.

- **Scope:** unified — cards (catalog), commanders (EDHREC profile + catalog fallback), sets (name/code)
- **Results:** grouped (Cards / Commanders / Sets); dedupe card vs commander when same slug
- **Destination:** card result → `/cards/{slug}`; commander result → `/commanders/{slug}` or `/cards/{slug}?view=commander` (implementation choice; both routes stay valid)
- **Route:** `/search?q=` and/or header combobox; section browse pages keep local filters but are not the only search UX

### Cards browse (`/cards`)

**Not search-only.** Default content on load. **Primary tab data source updated in Phase 1.6** (`edhrec_top_entries`); table below reflects Phase 1.5 baseline.

| Tab | Data source | Default sort | Notes |
|---|---|---|---|
| **Popular** | `edhrec_card_data` (HOT + WARM) | `inclusion` or `num_decks` desc | → **Most played** + top index in 1.6 |
| **All cards** | `cards` (commander-legal filter optional) | name asc | Full catalog |

**Shared:** pagination (cursor), sort options, filters (color, CMC band, type contains, commander-legal, has EDHREC data). Search within browse narrows current tab or uses global search.

### Commanders browse (`/commanders`)

**Primary tab data source updated in Phase 1.6** (`edhrec_top_entries`).

| Tab | Data source | Default sort | Notes |
|---|---|---|---|
| **Ranked** | `edhrec_commander_profiles` where `rank IS NOT NULL` | `rank` asc | → **Top commanders** + top index in 1.6 |
| **All commanders** | Union: EDHREC profiles + catalog `cards.is_commander` | `num_decks` desc, then name | Every catalog commander listed |

Search: EDHREC names first; **All** tab always includes full catalog with badges (not hidden until synced).

### Sets browse (`/sets`)

- **Default:** all sets, `releasedAt` desc
- **Pagination:** required (~733 sets; today capped at 60)
- **Sort:** release date, name, card count
- **Filters:** set type (commander, expansion, masters, …), digital yes/no, indexed only (has `set_cards`)

Set detail (`/sets/{code}`) unchanged in spirit; improve pagination on card list if &gt;500.

### Pagination pattern (all browse APIs)

- Request: `limit` (default 50, max 100), `cursor`, `sort`, `order`, filters
- Response: `{ items, total, nextCursor }`
- UI: **Load more** button (MVP); infinite scroll optional later

### Detail pages — parallel routes + unified content

**`/cards/{slug}`** — always renders oracle card (Scryfall). Never `notFound` if card exists in catalog.

| Section | Source |
|---|---|
| Image, type, oracle, keywords | `cards` |
| EDHREC salt, top commanders | `edhrec_card_data` via cache (empty state if missing) |
| Relatives by subtype | `cards` local query |
| **Commander tab** (if `is_commander` and EDHREC profile exists) | same sections as commander page: rank, salt, themes, top cards, similar |

**`/commanders/{slug}`** — kept as **parallel route** (SEO + EDHREC-like URLs). Same underlying data; prominent link “View as card”. If no EDHREC profile but card exists in catalog → show card shell + banner (no hard 404).

**Cross-links:** both pages link to each other when slug is shared.

### Printing context (`?set=`)

**Problem:** `cards.imageUri` is default oracle printing; set list shows correct art in `set_cards.imageUri`.

**MVP (Phase 1.5):** Set detail links to `/cards/{slug}?set={code}`. Card detail reads `set` searchParam; if `set_cards` has row for `(slug→oracle, set)`, use that `imageUri` for hero image. Fallback: oracle image.

**Future — Printings tab (documented, not Phase 1.5):** Tab on card detail listing all indexed printings (from `set_cards` or future `card_printings` table); user picks art; optional URL `/cards/{slug}/prints/{id}`. See `docs/ROADMAP.md` Phase 1.5 backlog.

### Empty / partial data UX

| Situation | Behaviour |
|---|---|
| Card in catalog, no EDHREC | Card page works; EDHREC sections show “not cached yet” |
| Commander in catalog, no EDHREC profile | Commander route works; EDHREC sections show “not cached yet”; omitted from top browse lists |
| EDHREC stale | Existing `StaleCacheBanner` (dev hints optional) |
| Set not indexed | Set metadata + sync hint (unchanged) |

## Discovery parity (Phase 1.6)

**Goal:** EDHREC-like list density and commander/card detail behaviour while keeping **catalog-first** identity and neutral copy. **Completed 2026-07-14** — unblocks Phase 2.

Decisions: `docs/DECISIONS.md` (2026-07-12, 2026-07-12 top index). UI patterns: `docs/UI.md`.

### In scope

- `/cards` (**Top cards**) — EDHREC top lists; **time window** `week` \| `month` \| `year` (default `year`; no all-time — EDHREC has no card top JSON)
- `/commanders` (**Top commanders**) — EDHREC top lists + **All time** (`edhrec_commander_profiles.rank`)
- `/catalog` — full Scryfall **`cards`** catalog (`tab=all` API); same browse filters + **Commanders only**; links commanders to `/commanders/{slug}`. Full catalog via **global search** and **sets** as well (no All tab on top pages).
- **Top list parity** — browse primary tabs read **`edhrec_top_entries`** (synced from EDHREC top JSON), not HOT+WARM subset
- Commander detail — all `cardlists` sections; Themes \| Kindred; **Budget + Bracket + Theme** filter bar → **`edhrec_page_variants`**
- Card detail — similar cards, Scryfall USD prices, salt badge, synergy on top commanders; **EDHREC cardlists** (top cards, game changers, type buckets); relatives; `EntityDetailTabs` unchanged (no Theme/Budget filter bar — EDHREC `?cost=` has no effect on card JSON)
- Similar commanders — thumbnail + rank + decks
- `/search`, `/sets`, `/` — visual alignment
- Production **“Popularity data unavailable”** badge when overlay missing

### Out of scope (Phase 1.6)

- `/themes` hub routes (inline filters on detail only)
- Dedicated Saltiest pages/tabs
- External deck-builder links
- Average deck when not in cached JSON
- Full **38k card** EDHREC catalog sweep
- Card Printings tab (backlog)

### EDHREC data layers (nothing deprecated)

| Layer | Storage | Used for |
|---|---|---|
| **Top index** | `edhrec_top_entries` (new) | Browse Most played / Top commanders + window filter |
| **Default profiles** | `edhrec_commander_profiles`, `edhrec_card_data` | Detail default view, All-tab joins, search, sitemap, HOT freshness |
| **Filter variants** | `edhrec_page_variants` (new) | Detail Theme/Budget/Bracket (commander + card) |
| **Scryfall catalog** | `cards`, `set_cards`, … | Oracle, images, prices, All tabs, legality |

Sync jobs **HOT**, **commander catalog**, and **on-demand** cache remain; add **`sync:edhrec-top-lists`**. See `docs/ARCHITECTURE.md`.

### Cards browse (`/cards`) — Phase 1.6

| Tab | Label | Data source | Default sort |
|---|---|---|---|
| Primary | **Most played** | `edhrec_top_entries` where `entity_type=card` + `window` | rank asc (EDHREC order) |
| Secondary | **All** | `cards` catalog (+ optional join `edhrec_card_data` for sort/filter) | name asc |

### Commanders browse (`/commanders`) — Phase 1.6

| Tab | Label | Data source | Default sort |
|---|---|---|---|
| Primary | **Top commanders** | `edhrec_top_entries` where `entity_type=commander` + `window` | rank asc |
| Secondary | **All** | catalog `is_commander` + optional `edhrec_commander_profiles` | num_decks desc |

### Detail filters (commander + card)

On `/commanders/{slug}` and `/cards/{slug}` only (not browse):

- **Theme**, **Budget**, **Bracket** (commander; bracket TBD in spike) — change stats and cardlists via **`edhrec_page_variants`**; on-demand EDHREC fetch on miss
- **Default** view (no filters) — `edhrec_commander_profiles` / `edhrec_card_data` unchanged

Browse routes remain **Postgres-only** (no live EDHREC).

### Empty / partial data UX (Phase 1.6 update)

| Situation | Behaviour |
|---|---|
| Card in catalog, no popularity row | Card page works; sections show neutral empty state |
| Commander in catalog, no profile | Commander route + All browse: card shell + **production badge** “Popularity data unavailable” |
| Filter variant not cached | Fetch on-demand on detail; stale banner if fetch fails |

## Analysis engine

### Card classification priority

1. Manual overrides (~200 competitive staples)
2. Scryfall oracle tags (Tagger project, weight ≥ median)
3. Conservative regex on oracle text
4. No match → unclassified (prefer empty over false positive)

### Functional counts (registered)

- **Removal:** hard (destroy/exile) + soft (bounce, -X/-X, fight)
- **Ramp:** mana + land search + cost reduction
- **Draw:** strict "draw cards" only (no scry/loot in MVP)
- **Counterspells** and **Discard** — separate categories

### 14 synergy themes (high confidence only)

Sacrifice/Aristocrats, Graveyard recursion, Token generation, +1/+1 Counters, Spells matter, Discard/Madness, Life gain/Drain, Equipment/Voltron, Landfall, Artifacts matter, Blink/Flicker, Burn, Tribal (subtype — includes instant/sorcery subtypes), Mill

### UI adaptivity

- Deck &lt; 60% of target size → card-level synergy focus
- Deck ≥ 60% → deck-level theme dashboard

### Archetype auto-detect

Jaccard similarity between deck synergy themes and EDHREC `tag_counts` for commander. User can override. Fallback: manual tag if overlap below threshold.

## Import format (Arena paste)

```
About
Name Deck Name

Deck
4 Lightning Bolt
...

Sideboard
2 Negate
```

- Merge duplicate card lines with warning
- Unrecognized cards → skip + report count; partial import OK

## Guest flow

- Paste/import at `/analyze` — basic stats only, no save, no export link
- Signup prompt for full analysis + save

## Attribution

- Card data: [Scryfall](https://scryfall.com) (Fan Content Policy — no paywall on card data)
- Meta data: [EDHREC](https://edhrec.com) — link back, cache locally, no live dependency in hot path
- Not affiliated with Wizards of the Coast
