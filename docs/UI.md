# MTGPlayground — UI guide

Living reference for layout and components. Historical Phase 1.6–1.8 discovery chrome remains below; **product end-state** is the MTGPlayground pivot (`docs/PROJECT.md`, `docs/DECISIONS.md` 2026-07-20).

> Status: Phase **2.0** complete → **Phase 2.1** Auth + Collection.

## Pivot UI principles (current)

1. **Printing-first** — version picker (set / art / foil) is a core pattern, not collection-only.
2. **Single card detail** — one oracle page at `/cards/{slug}`; `/commanders/{slug}` redirects.
3. **Multiface** — staggered front/back stack on detail + tiles; hover the back face to bring it forward.
4. **Honest Inclusion** — Scryfall Commander **deck inclusion** rank only; never “as commander” popularity. UI label: **Inclusion**.
5. **Commanders browse** — legality filter (name-first); not a meta ranking hub.
6. **Collection + decks** — owned/missing in builder (Phase 2.1–2.2). Workspace (deck editor) uses **contextual overlays** for search/Add and card peek; catalog keeps the full `/cards/{slug}` PDP.

## Principles (legacy EDHForge discovery)

1. **Data-first** — browse/search read Postgres only.
2. **Reuse the shell** — `AppHeader`, `AppFooter`, `PageShell`; shared discovery components across routes.
3. **English only** (MVP) — labels, metadata, empty states.
4. **Attribution** — Scryfall (+ WotC) in footer; no EDHREC.
5. **Mobile-first, desktop-dense** — sticky header / section jump as today.
6. **Oracle hub + printings** — card at `/cards/{slug}` with Version picker (`?set=` / `?cn=` / `?finish=`).
7. ~~Parallel commander URLs~~ — **deprecated** by pivot; merge into single detail.
8. **Neutral Inclusion copy** — inclusion-rank wording; no fake commander meta.

## Layout

| Component | Path | Role |
|---|---|---|
| `AppHeader` | `src/components/layout/app-header.tsx` | Logo, search, desktop nav / mobile menu |
| `MobileNavSheet` | `src/components/layout/mobile-nav-sheet.tsx` | Hamburger → shadcn `Sheet` with `mainNav` (`lg:hidden`) |
| `AppFooter` | `src/components/layout/app-footer.tsx` | Attribution |
| `PageShell` | `src/components/layout/page-shell.tsx` | Container, breadcrumbs, H1 |
| `mainNav` | `src/lib/navigation.ts` | Header links |

### Width & spacing

- Content max width: **`max-w-7xl`** (`siteContainerClassName` in `src/lib/ui/layout.ts`) — header, footer, `PageShell`
- Page padding: `px-6`, vertical `py-10` / `lg:py-12`
- Filter chrome: shadcn `Input`, `Select`, `Label` (dense `text-xs` labels) via `BrowseSearchField` / `BrowseSelectField` — not native `<input>` / `<select>`
- Filter toggles: shadcn `Toggle` / `ToggleGroup` (mana, rarity, option pills); sort order uses `Button` icon
- Sticky below header: `--site-header-height` (set by `AppHeader` ResizeObserver) + `SITE_STICKY_BELOW_HEADER_CLASS`
- Notices: shadcn `Alert` (`StaleCacheBanner`, `EdhrecSyncNotice`, `FilterUnavailableNotice`)
- Card grids: browse `CARD_FACE_GRID_CLASS` (`2 / md:3 / xl:5`); detail sections `CARD_FACE_DETAIL_GRID_CLASS` (`2 / md:3 / xl:4`)
- **Desktop-dense:** tighter gaps on meta lines; card grids stay roomier than EDHREC max density

## Tokens (Phase 1.6 + UI kit)

**Design system:** [shadcn/ui](https://ui.shadcn.com) (base-nova, Tailwind v4) in `src/components/ui/`. **Dark-only**; cool neutrals + orange brand; `next-themes` with `forcedTheme="dark"` (+ static `html.dark` for first paint).

**Source of truth:** `src/app/globals.css` — two layers:

1. **`--palette-*`** — unique OKLCH swatches (edit a color once here)
2. **Semantic tokens** (`--primary`, `--background`, …) — roles that `var()` the swatches (shadcn + Tailwind `@theme`)

Hue split: surfaces ~255° (cool gray) · brand/primary ~75° (amber) · info/chart-2 ~200° (teal) · warning ~70° · destructive ~25°. Do not paste raw `oklch(...)` in components; use semantic classes (`bg-primary`, `text-muted-foreground`, …).

| Semantic token | Use |
|---|---|
| `--primary` / `--primary-foreground` | Brand amber — nav active, rank badge, CTA, links |
| `--background` / `--foreground` | Cool near-black page base + near-white copy |
| `--card` / `--popover` | Elevated cool panels |
| `--muted` / `--muted-foreground` | Secondary cool surfaces / copy |
| `--accent` | Hover / pressed soft brand tint (low-chroma orange) |
| `--border` / `--input` / `--ring` | Fields, cards, focus rings (`color-mix` from hairline / brand) |
| `--warning` / `--warning-foreground` | Salt mid, alert warning |
| `--info` / `--info-foreground` | Dev/sync notices (teal) |
| `--destructive` | Errors, salt high |
| Rank badge | `RankBadge` → shadcn `Badge` (primary) |
| Salt badge | Shaker icon + numeric value (warning / destructive tones) |
| Mana symbols | `ManaSymbol` / `ColorIdentity` — vendored Scryfall SVGs |
| Rarity symbols | `RarityIcon` — inline gem SVGs |
| Generic UI icons | `lucide-react` via `src/components/ui/icon.tsx` |

**Already centralized (keep using these, don’t re-hardcode):**

| Concern | Where |
|---|---|
| Site max-width / gutter | `src/lib/ui/layout.ts` (`siteContainerClassName`) |
| Header height / sticky offsets | `--site-header-height` + `SITE_STICKY_*` in `layout.ts` |
| Card grid density | `src/lib/ui/card-face.ts` |
| Browse filter grid templates | `browse-toolbar-shared.ts` |
| Detail section panel / scroll-mt | `src/lib/ui/detail-section-nav.ts` |

Light mode / theme toggle: not shipped (kept possible via `next-themes`).

### Layout components

| Component | Path | Role |
|---|---|---|
| `DetailSectionPanel` | `src/components/discovery/detail-section-panel.tsx` | Reusable detail section card (cardlists, themes, …) |
| `ThemeProvider` | `src/components/layout/theme-provider.tsx` | Forced dark mode |
| `NavLink` / `NavLinks` | `src/components/layout/nav-link.tsx`, `nav-links.tsx` | Header nav (primary active state) |
| `PageListMeta` | `src/components/layout/page-list-meta.tsx` | Browse count / hint line |
| `BrowseFilterPanel` | `src/components/discovery/browse-filter-panel.tsx` | Card wrapper for filter toolbars |
| `BrowseFilterPanelRow` | same | Last row flex wrapper; optional sort-order `Button` on the right |
| `BrowseSelectField` / `BrowseSearchField` | `browse-filter-controls.tsx` | shadcn Select + Input for all browse/detail filter toolbars |
| `DetailSectionJump` | `detail-section-jump.tsx` | Mobile sticky section jump `DropdownMenu` (`lg:hidden`) |
| Notices | `stale-cache-banner`, `edhrec-sync-notice`, `filter-unavailable-notice` | shadcn `Alert` (default / `warning` / `info` / muted) |

## Browse pattern (Phase 1.8)

```
PageShell
  [toolbar slot] — BrowseFilterPanel (always visible; Commander option first)
  PageListMeta — counts / hints
  Grid
  Load more (Button outline)
```

| Page | Title | View |
|---|---|---|
| `/browse` | **Browse** | Hub grid — facets; **Format** select (`legalities`); **Commander** option filters `isCommander` |
| `/cards` | (redirect) | → `/browse` |
| `/commanders` | (redirect) | → `/browse?commanders_only=true` |

Full catalog browse: **`/browse`**, **global search** (`/search` — same card/set grids), and **sets** (`/sets`).

### Grid tile (default)

Shared **`CardFaceTile`** — full-width card image (`CardMultifaceImage` / `CardImage` grid variant, proportional corner radius) + optional footer metrics. No outer border. Multiface cards show a **staggered front/back stack**; hover the back (offset strip) to raise it.

- Footer: Scryfall **Price** + **Inclusion** (rank) + **Friction** (when &gt; 0) on cards and commanders browse (Inclusion = deck inclusion, not “as commander”)

Detail sections (role staples, relatives, set detail grid) use the same tile + `CARD_FACE_GRID_CLASS` / `CARD_FACE_DETAIL_GRID_CLASS`.

### Sets browse

Horizontal **set row cards** (`SetBrowseRow`) in a wide grid (`SET_BROWSE_GRID_CLASS`: 1 col → 2 @ `md` → 3 @ `xl`). Same inner layout as before; only the list container is multi-column.

### Search results

Compact **horizontal rows** (`Card` + thumbnail) per entity type — not `CardFaceTile` grid. Suited to mixed entity results and quick scanning.

## Browse filters (Phase 1.8)

Shared **`BrowseFilterPanel`** styling on all list pages. Grid tokens live in `browse-toolbar-shared.ts`. **Browse hub** uses two field rows: primary (`browseToolbarHubPrimaryGridClassName` — search · sort · type · CMC) and secondary (`browseToolbarHubSecondaryGridClassName` — Role · Theme · Format, equal columns). Pill row uses `browseToolbarHubPillGroupsClassName` (Color + Rarity hug; Options flexes so pills stay one line). CMC min/max are one grid cell (`browseToolbarCmcPairClassName`). **Sets browse** uses `browseToolbarDenseGridClassName`; **set detail** uses `browseToolbarSetDetailGridClassName` (includes Format). Pill groups sit on a second row in **`BrowseFilterPanelRow`** with the sort-order icon on the right.

| Control | Style | Pages |
|---|---|---|
| Field label | `text-xs` muted, `mb-1` — same for search, select, text | All browse toolbars |
| Field height | `h-8` unified (search, select) | All browse toolbars |
| Color identity | Multi-select **mana symbol** buttons (W/U/B/R/G/C) | Top cards, Top commanders, Catalog, Set detail |
| Rarity | Multi-select **rarity gem** buttons | Top cards, Catalog, Set detail |
| Sort order | **Arrow up/down** icon — right side of last filter row (`BrowseFilterPanelRow`) | Browse pages with sort |
| Sort order (field row) | Removed from grid | — |
| Search | Leading **search** icon; matches **name, type, oracle text** (FTS) | Browse toolbars, global search |
| Grid / list toggle | **Backlog** — grid-only today; no unused toggle component in tree | Recreate if needed |
| Format | Select — curated Scryfall keys; filter `legalities[format] === "legal"` | `/browse`, set detail |
| Sort by | **Inclusion (Commander)** / **Color & CMC** / Name / CMC / Price | `/browse` |
| Sort defaults | Format Any or Commander → Inclusion; other formats → Color & CMC; Options Commander on → Name | `/browse` |
| Commander (hub) | **Toggle pill** — `isCommander` (can be your commander), not format legality | `/browse` Options (**first**) |
| Type contains, CMC min/max | Text + **compact number** fields (`~4.25rem`) | All card lists + set detail |
| Set type | Select from **distinct** `mtg_sets.set_type` | `/sets` |
| Role / Theme | Select from product enums, **hide-empty** vs `card_classifications` | `/browse` |
| Set detail sort | Collector #, Name, Rarity, CMC + order toggle | `/sets/[code]` |

Color filter uses **`colorIdentity`** (Commander identity), comma-separated in API `color=W,U` param.

**Inclusion** on browse tiles is Commander (EDH) deck inclusion from Scryfall. Sort label is **Inclusion (Commander)**. Tile footer hides Inclusion when Format is a non-Commander constructed format **and** sort is not Inclusion (avoids implying Modern/Pioneer popularity).

Catalog/top-card **rarity** filter matches the oracle’s **lowest** printing tier across `printings` (not “any printing”). Set detail filters each printing row directly.

## Card detail (Phase 1.6–2.0)

Printed-card facts (CMC, colors, oracle, keywords) are **not** duplicated in the main column — they live on the card image.

**Two bands:**

1. **Overview** — image + set/cn caption | details panel filling the fluid column: **Status** (chips) → **Printing** (Version / Finish + **Show all versions** when multiple printings) → **Market** (prices) → **Roles | Themes** (two columns from `sm`)
2. **Lists** — related sections; sticky **DetailSectionNav** (lg+) / **DetailSectionJump** (mobile) on the left of the lists band (not under the image)

**As card / As commander:** When `isCommander`, a full-width **As card | As commander** ToggleGroup switches list packs via `?view=commander` (default = card). Non-commanders have no toggle and always show card lists. Version params (`set` / `cn` / `finish`) are preserved across view switches.

| View | Sections |
|---|---|
| As card | Similar cards · Relatives by subtype |
| As commander | Role staples (per role) · Game Changers in CI · Build skeleton |

**Version URL:** `/cards/{slug}?set={code}&cn={collector}&finish={foil|etched}&view=commander`. Bare `/cards/{slug}` still resolves the catalog-default printing and pre-selects it in the VersionPicker (no separate “Catalog default” option). Set pages link with `set`+`cn`. Nonfoil omits `finish`. Foil/etched add a CSS sheen on the hero image (same Scryfall art URI).

**Show all versions:** Bottom Sheet (~85dvh) with browse-like `CardFaceTile` grid (art + `SET #cn · set name` + EUR prices). One tile per printing (`set`+`cn`); Finish stays on the VersionPicker. Click navigates with the same `buildCardVersionHref` contract (preserves finish when available + `view`). Trigger only when `printings.length > 1`.

**Workspace overlays (Phase 2.2 building blocks):** `WorkspaceSearchOverlay` (FTS + Add / peek callbacks) and `CardPeekSheet` (compact overview + printing controls in callback mode + “Open full page”). Hosted by the deck editor when it lands — not used as a browse replacement. See `docs/DECISIONS.md` 2026-07-22.

**Card tilt:** Detail + grid previews use CSS 3D pointer tilt (`CardTilt` via `CardMultifaceImage`). Thumbnails stay flat. Respects `prefers-reduced-motion`; no continuous tilt on touch.

**Click targets:** Set browse rows (`SetBrowseRow`) are full-surface links (no card art). Card tiles (`CardFaceTile`) link the face image only — footer metrics stay outside the hit target. Interactive chrome (`Button`, `Toggle` / filter pills & mana/rarity, `Select`, dropdown items) uses `cursor-pointer`.

**Mobile (`< lg`):** overview (centered image max 300px → meta) → optional view toggle → sticky `DetailSectionJump` → sections.

**Desktop (`lg+`):** overview (image | meta) scrolls; lists band uses sticky TOC + sections (`DETAIL_LISTS_GRID_CLASS`).

```
Overview: image + set/cn | Status → Version/Finish + Show all versions → Market → Roles | Themes
Lists: [As card | As commander full-width]? → sticky DetailSectionNav (lg+) | sections for active view
```

`/commanders/[slug]` permanent-redirects to `/cards/[slug]` preserving version params (Phase 2.0.4 / 2.0.7). Related parts (`all_parts`) remain removed from PDP. Deck-builder insights (Phase 2.2.6) may still reuse the same D2 helpers.

## Commander detail (archive — dual routes superseded by 2.0.4)

~~Parallel `/commanders/[slug]` detail + route-switching Card \| Commander tabs~~ — removed. List packs return on the single `/cards/[slug]` hub via **As card / As commander** (`?view=commander`) when `isCommander`. Browse uses a **Commander** Options pill (`commanders_only` / `isCommander`), not a Cards \| Commanders entity tab.

### Card vs commander parity

| Element | Card detail (current) | Notes |
|---|---|---|
| Canonical URL | `/cards/{slug}` | `/commanders/{slug}` redirects here |
| Inclusion rank | ✅ | Deck inclusion — not “as commander” popularity |
| Legal commander chip | when `isCommander` | |
| As card / As commander lists | when `isCommander` | `?view=commander` for D2 pack |
| Role staples / GC in CI / skeleton | As commander view | Also reusable in deck builder (2.2.6) |

## Components (target after 1.6)

Folder: `src/components/discovery/`

| Component | Phase | Use |
|---|---|---|
| `CardGridTile` | 1.6.1 | Browse grid cell → `CardFaceTile` + `EntityPreviewFooter` |
| `CommanderGridTile` | 1.6.x | Browse commander cell → same footer (rank primary) |
| `CardFaceTile` | 1.6.20 | Image-first grid cell (browse + detail sections) |
| `EntityPreviewFooter` | unified previews | Row: prices ↔ salt; row: primary (large label) ↔ compact decks; synergy when set. Detail cardlists enrich salt from EDHREC cache (cardviews omit it). |
| `CardFaceMetricFooter` | 1.6.20 | Thin wrapper → `EntityPreviewFooter` for EDHREC cardlists |
| `CardMetricRow` | 1.6.5 | *(replaced by `CardFaceTile` + footer in 1.6.20)* |
| `CardListSection` | 1.6.5 | One EDHREC cardlist block |
| `PopularityUnavailableBadge` | 1.6.1 | Production missing-meta badge |
| `EdhrecSyncNotice` | ops | Browse banner when weekly popularity sync failed or &gt;8 days (`/cards`, `/commanders` layouts) |
| `CommanderFilterBar` | 1.6.14 | Theme / budget / bracket (commander) |
| `RankBadge` | 1.6.1 | `#42` (legacy; browse/hero use footer primary) |
| `SaltBadge` | 1.6.1 | Used inside `EntityPreviewFooter` |
| `PriceChip` | 1.6.16 | Scryfall **EUR** (Cardmarket) with USD fallback; inside `EntityPreviewFooter` |
| `DetailHeroBadges` | 1.6.16 | *(superseded by `EntityPreviewFooter` on hero)* |
| `CardDetailCardlistSections` | 1.6.16 | EDHREC co-played cardlists on card detail |
| `DetailSectionNav` | 1.6.20 | Desktop sticky section list (`lg+`, below header) |
| `DetailSectionJump` | mobile-first | Sticky section jump dropdown (`lg:hidden`, below header) |
| `DetailSectionPanel` | 1.7.1 | Shared panel wrapper for detail sections |
| `DetailHeroAside` | 1.7.x | Image + `previewFooter` (not sticky); hosts sticky TOC at `lg+` |
| `MobileNavSheet` | mobile-first | Header hamburger menu |
| `ManaSymbol` / `ColorIdentity` | 1.6.20 | MTG mana icons (browse filters + list rows) |
| `RarityIcon` | 1.6.20 | Rarity gems (filter + set grid) |
| `BrowseSortOrderToggle` | 1.6.20 | Asc/desc icon in `BrowseFilterPanelRow` |
| `SaltIcon` + `SaltBadge` | 1.6.20 | Salt shaker + value |
| `metric-icon-label` | 1.6.20 | Inclusion / synergy / decks icon prefixes |
| `EdhrecSimilarCards` | 1.6.16 | Card detail similar grid — `EntityPreviewFooter` (prices · inclusion · decks · salt from cache) |
| Existing | 1.5–1.6 | `LoadMoreButton`, toolbars, grid tiles, … |

**Dev-only:** `CatalogDebugPanel`, `DevEdhrecCoverageBadge` (dev list rows when overlay missing — production uses `PopularityUnavailableBadge`).

## Routes (Phase 1.6 touch)

| Route | 1.6 changes |
|---|---|
| `/` | Discovery shortcuts (Top cards, Top commanders, Catalog, Sets, Search) |
| `/cards`, `/commanders` | Top lists only (no All tab); grid tiles; time window |
| `/catalog` | Full catalog grid; commander filter; no EDHREC rank |
| `/commanders/[slug]` | **Redirect →** `/cards/[slug]` (2.0.4) |
| `/cards/[slug]` | Sole oracle hub; Inclusion + Legal commander chip |
| `/search` | Card grid (`CARD_FACE_GRID_CLASS` + `CardGridTile`) and set grid (`SET_BROWSE_GRID_CLASS` + `SetBrowseRow`) — same tiles as browse / sets |
| `/sets` | Horizontal set cards in wide grid; dense filter toolbar |
| `/sets/[code]` | `CardFaceTile` grid; footer is centered collector `#` only; filters + **sort by** in toolbar |

## Checklist for 1.6 UI work

- [x] Grid default on cards/commanders browse (list toggle → backlog)
- [x] Top pages: **Top cards** / **Top commanders** / **Catalog** (no All tab on top lists)
- [x] Inclusion % (not raw deck count) in browse metrics
- [x] Browse primary tabs use top index (not HOT+WARM tier filter)
- [x] Time window on browse
- [x] Commander + card detail filter bars
- [x] Production popularity-unavailable badge
- [x] No live EDHREC in browse/search server render
- [x] Footer attribution unchanged
- [x] Search: card + set grids aligned with browse / sets list
- [x] Sets browse: horizontal cards in wide grid
- [x] Search navbar dropdown: compact horizontal rows (unchanged)

## Backlog (post-1.6)

- Grid / list toggle on cards/commanders browse

- Printings tab on card detail
- `/themes` hub
- Dedicated Saltiest routes
- Light mode / theme toggle (re-enable via `next-themes`)
- Command palette (`⌘K`)
