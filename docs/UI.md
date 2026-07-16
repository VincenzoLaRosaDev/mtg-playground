# EDHForge — UI guide

Living reference for layout and components. **Phase 1.6** discovery parity spec: `docs/PROJECT.md` § Discovery parity · task list: `docs/ROADMAP.md` § Phase 1.6.

> Status: **Phase 1.6 complete** → Phase 2 deck builder next.

## Principles

1. **Data-first** — browse/search read Postgres only; detail pages may trigger on-demand cache refresh when filters change.
2. **Reuse the shell** — `AppHeader`, `AppFooter`, `PageShell`; shared discovery components across routes.
3. **English only** (MVP) — labels, metadata, empty states.
4. **Attribution** — Scryfall + EDHREC links in **footer only** (no “View on EDHREC” on detail).
5. **Mobile-first, desktop-dense** — design for small screens first; expand density at `lg+`. Header uses hamburger `Sheet`; browse/detail filters stay always visible; detail section TOC is a sticky jump menu on mobile and a sticky aside nav on desktop (below the measured header height).
6. **Oracle first** — card always at `/cards/{slug}`; popularity is an overlay with neutral empty states.
7. **Parallel commander URLs** — `EntityDetailTabs` (outline `ToggleGroup`, same pattern as Themes/Kindred; Card | Commander links) on both card and commander routes.
8. **Neutral popularity copy** — no upstream product names in UI except footer; use “Popularity data unavailable” badges in production.

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
| `EntityDetailTabs` | `entity-detail-tabs.tsx` | Outline `ToggleGroup` — Card ↔ Commander route switch |
| `DetailSectionJump` | `detail-section-jump.tsx` | Mobile sticky section jump `DropdownMenu` (`lg:hidden`) |
| Notices | `stale-cache-banner`, `edhrec-sync-notice`, `filter-unavailable-notice` | shadcn `Alert` (default / `warning` / `info` / muted) |

## Browse pattern (Phase 1.6)

```
PageShell
  [toolbar slot] — window selector + BrowseFilterPanel (always visible)
  PageListMeta — counts / hints
  Grid
  Load more (Button outline)
```

| Page | Title | View |
|---|---|---|
| `/cards` | **Top cards** | Grid only |
| `/commanders` | **Top commanders** | Grid only |
| `/catalog` | **Catalog** | Grid only — full `cards` table |

Full catalog browse: **global search** (`/search`), **catalog** (`/catalog`), and **sets** (`/sets`).

### Grid tile (default)

Shared **`CardFaceTile`** — full-width card image (`CardImage` grid variant, proportional corner radius) + optional footer metrics. No outer border.

- Rank, inclusion/decks, salt, synergy — footer row (`justify-between`, single line, no wrap)
- `PopularityUnavailableBadge` when top index missing for window

Detail sections (`CardListSection`, similar cards/commanders, relatives, set detail grid) use the same tile + `CARD_FACE_GRID_CLASS`.

### Sets browse

Horizontal **set row cards** (`SetBrowseRow`) in a wide grid (`SET_BROWSE_GRID_CLASS`: 1 col → 2 @ `md` → 3 @ `xl`). Same inner layout as before; only the list container is multi-column.

### Search results

Compact **horizontal rows** (`Card` + thumbnail) per entity type — not `CardFaceTile` grid. Suited to mixed entity results and quick scanning.

## Browse filters (Phase 1.6)

Shared **`BrowseFilterPanel`** styling on all list pages. Grid tokens live in `browse-toolbar-shared.ts`. **Cards / commanders / catalog** use `browseToolbarListGridClassName` (search · sort · type · CMC pair: 1 col → `sm` 2×2 → one row at `lg+`). CMC min/max are one grid cell (`browseToolbarCmcPairClassName`) so they stay compact without orphan columns. **Commander detail** uses equal `sm:grid-cols-3` (`browseToolbarCommanderDetailGridClassName`). **Sets browse** uses `browseToolbarDenseGridClassName`; **set detail** uses `browseToolbarSetDetailGridClassName`. Pill groups sit on a second row in **`BrowseFilterPanelRow`** with the sort-order icon on the right.

| Control | Style | Pages |
|---|---|---|
| Field label | `text-xs` muted, `mb-1` — same for search, select, text | All browse toolbars |
| Field height | `h-8` unified (search, select) | All browse toolbars |
| Color identity | Multi-select **mana symbol** buttons (W/U/B/R/G/C) | Top cards, Top commanders, Catalog, Set detail |
| Rarity | Multi-select **rarity gem** buttons | Top cards, Catalog, Set detail |
| Sort order | **Arrow up/down** icon — right side of last filter row (`BrowseFilterPanelRow`) | Browse pages with sort |
| Sort order (field row) | Removed from grid | — |
| Search | Leading **search** icon in field | Browse toolbars, global search |
| Grid / list toggle | **Backlog** — grid-only today; no unused toggle component in tree | Recreate if needed |
| Commander legal / Commanders only / Indexed only | **Toggle pills** (not checkboxes) | Catalog, Top cards, Set detail, Sets browse |
| Type contains, CMC min/max | Text + **compact number** fields (`~4.25rem`) | All card lists + set detail |
| Set detail sort | Collector #, Name, Rarity, CMC + order toggle | `/sets/[code]` |

Color filter uses **`colorIdentity`** (Commander identity), comma-separated in API `color=W,U` param.

Catalog/top-card **rarity** filter matches the oracle’s **lowest** printing tier across `set_cards` (not “any printing”). Set detail filters each printing row directly.

## Card detail (Phase 1.6 + 1.7)

Printed-card facts (CMC, colors, oracle, keywords) are **not** duplicated in the main column — they live on the card image. Under the image: set printing note (when applicable), then the same **`EntityPreviewFooter`** as browse/list tiles (prices ↔ salt; primary ↔ compact decks).

**Mobile (`< lg`):** centered image (max 300px) → meta → sticky `DetailSectionJump` (below header) → sections.

**Desktop (`lg+`):** image + meta scroll normally; only `DetailSectionNav` is sticky below the header. No compact/hide-on-scroll for under-image meta.

```
[StaleCacheBanner?]
EntityDetailTabs (when card is a commander)
Hero aside: image → set note → EntityPreviewFooter → sticky DetailSectionNav (lg+)
Main: DetailSectionJump (mobile) → unique sections → shared cardlists
```

## Commander detail (Phase 1.6 + 1.7)

Same under-image `EntityPreviewFooter` (USD → Rank → decks / salt). Theme / Budget / Bracket filters always visible in the main column. Card tiles in commander cardlists show inclusion + synergy when present; similar commanders use Rank like other commander tiles.

```
[StaleCacheBanner?]
EntityDetailTabs
Hero aside: image → EntityPreviewFooter → sticky DetailSectionNav (lg+)
Main: filter bar → DetailSectionJump (mobile) → unique sections → shared cardlists
```

### Card vs commander parity (list + detail)

| Element | Card | Commander |
|---|---|---|
| Browse / hero / detail-list footer | `EntityPreviewFooter` | `EntityPreviewFooter` |
| Primary metric | inclusion % | rank (`#N`; detail: all-time) |
| Prices · decks · salt | ✅ | ✅ |
| Synergy (footer) | top commanders on card detail | card tiles under commander detail |
| Browse CMC + colors | ✅ (filters/search) | ✅ (filters) |
| Detail EDHREC sections | top commanders, **cardlists**, similar cards, relatives | themes, cardlists, similar commanders |

Sections that exist on **only one** of the two detail views (card vs commander) appear **first** in `DetailSectionNav` and in the main column, with a subtle tinted panel (`bg-primary/5`). Shared cardlist buckets (e.g. New Cards, Top Cards, Creatures) follow without emphasis.

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
| `PriceChip` | 1.6.16 | Scryfall USD (inside `EntityPreviewFooter`) |
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
| Existing | 1.5–1.6 | `LoadMoreButton`, toolbars, `EntityDetailTabs`, grid tiles, … |

**Dev-only:** `CatalogDebugPanel`, `DevEdhrecCoverageBadge` (dev list rows when overlay missing — production uses `PopularityUnavailableBadge`).

## Routes (Phase 1.6 touch)

| Route | 1.6 changes |
|---|---|
| `/` | Discovery shortcuts (Top cards, Top commanders, Catalog, Sets, Search) |
| `/cards`, `/commanders` | Top lists only (no All tab); grid tiles; time window |
| `/catalog` | Full catalog grid; commander filter; no EDHREC rank |
| `/commanders/[slug]` | Filters + multi-section cardlists |
| `/cards/[slug]` | Similar, prices, salt badge |
| `/search` | Compact horizontal result rows (cards, commanders, sets) |
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
- [x] Sets browse: horizontal cards in wide grid
- [x] Search: compact horizontal rows

## Backlog (post-1.6)

- Grid / list toggle on cards/commanders browse

- Printings tab on card detail
- `/themes` hub
- Dedicated Saltiest routes
- Light mode / theme toggle (re-enable via `next-themes`)
- Command palette (`⌘K`)
