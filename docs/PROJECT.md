# EDHForge — Product Specification

> Last updated: 2026-07-09 · Phase 0 complete

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

- Search/browse: cards, commanders, sets
- Card page: oracle, image, top commanders (EDHREC), synergy cards, relatives by subtype
- Commander page: rank, salt, avg curve, top cards, themes, similar commanders
- Set page: cards with filters

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
