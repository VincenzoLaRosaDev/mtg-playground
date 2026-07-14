# EDHForge — UI guide

Living reference for layout and components. **Phase 1.6** discovery parity spec: `docs/PROJECT.md` § Discovery parity · task list: `docs/ROADMAP.md` § Phase 1.6.

> Status: **Phase 1.6 complete** → Phase 2 deck builder next.

## Principles

1. **Data-first** — browse/search read Postgres only; detail pages may trigger on-demand cache refresh when filters change.
2. **Reuse the shell** — `AppHeader`, `AppFooter`, `PageShell`; shared discovery components across routes.
3. **English only** (MVP) — labels, metadata, empty states.
4. **Attribution** — Scryfall + EDHREC links in **footer only** (no “View on EDHREC” on detail).
5. **Desktop-dense, mobile-usable** — EDHREC-like information density on desktop; grid collapses gracefully on small screens.
6. **Oracle first** — card always at `/cards/{slug}`; popularity is an overlay with neutral empty states.
7. **Parallel commander URLs** — `EntityDetailTabs` (Card | Commander) on both card and commander routes.
8. **Neutral popularity copy** — no upstream product names in UI except footer; use “Popularity data unavailable” badges in production.

## Layout

| Component | Path | Role |
|---|---|---|
| `AppHeader` | `src/components/layout/app-header.tsx` | Logo, nav, global search |
| `AppFooter` | `src/components/layout/app-footer.tsx` | Attribution |
| `PageShell` | `src/components/layout/page-shell.tsx` | Container, breadcrumbs, H1 |
| `mainNav` | `src/lib/navigation.ts` | Header links |

### Width & spacing

- Content max width: **`max-w-7xl`** (`siteContainerClassName` in `src/lib/ui/layout.ts`) — header, footer, `PageShell`
- Page padding: `px-6`, vertical `py-10` / `lg:py-12`
- Filter labels: shadcn `Label` + `text-muted-foreground`
- **Desktop-dense:** tighter grid gaps on `md+` (`gap-3` grid, `text-sm` meta lines)

## Tokens (Phase 1.6 + UI kit)

**Design system:** [shadcn/ui](https://ui.shadcn.com) (base-nova, Tailwind v4) in `src/components/ui/`. Theme tokens in `src/app/globals.css`. **`next-themes`** — system light/dark via `.dark` class.

| Token | Use |
|---|---|
| `--primary` / `--primary-foreground` | Brand violet — nav active, rank badge, CTA, links |
| `--background` / `--foreground` | Page base |
| `--muted` / `--muted-foreground` | Secondary copy, filter labels, list meta |
| `--accent` | Hover surfaces (nav, pills) |
| `--border` / `--input` / `--ring` | Fields, cards, focus rings |
| `--card` | Filter panels (`BrowseFilterPanel`), home shortcuts |
| Rank badge | `RankBadge` → shadcn `Badge` (primary) |
| Salt badge | Shaker icon + numeric value |
| Mana symbols | `ManaSymbol` / `ColorIdentity` — vendored Scryfall SVGs |
| Rarity symbols | `RarityIcon` — inline gem SVGs |
| Generic UI icons | `lucide-react` via `src/components/ui/icon.tsx` |

Dark mode: **system only** (no toggle in 1.6).

### Layout components

| Component | Path | Role |
|---|---|---|
| `DetailSectionPanel` | `src/components/discovery/detail-section-panel.tsx` | Reusable detail section card (Stats, Oracle, …) |
| `ThemeProvider` | `src/components/layout/theme-provider.tsx` | System dark mode |
| `NavLink` / `NavLinks` | `src/components/layout/nav-link.tsx`, `nav-links.tsx` | Header nav (primary active state) |
| `PageListMeta` | `src/components/layout/page-list-meta.tsx` | Browse count / hint line |
| `BrowseFilterPanel` | `src/components/discovery/browse-filter-panel.tsx` | Card wrapper for filter toolbars |
| `BrowseFilterPanelRow` | same | Last row flex wrapper; optional sort-order icon on the right |

## Browse pattern (Phase 1.6)

```
PageShell
  [toolbar slot] — window selector + BrowseFilterPanel (Card)
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

Shared **`BrowseFilterPanel`** styling on all list pages. **Cards / commanders / catalog** use `browseToolbarListGridClassName` (wide search + sort + type + compact CMC fields on one row at `lg+`). **Sets browse** uses `browseToolbarDenseGridClassName`; **set detail** uses `browseToolbarSetDetailGridClassName` (+ sort by). Pill groups sit on a second row in **`BrowseFilterPanelRow`** with the sort-order icon on the right.

| Control | Style | Pages |
|---|---|---|
| Field label | `text-xs` muted, `mb-1` — same for search, select, text | All browse toolbars |
| Field height | `h-8` unified (search, select) | All browse toolbars |
| Color identity | Multi-select **mana symbol** buttons (W/U/B/R/G/C) | Top cards, Top commanders, Catalog, Set detail |
| Rarity | Multi-select **rarity gem** buttons | Top cards, Catalog, Set detail |
| Sort order | **Arrow up/down** icon — right side of last filter row (`BrowseFilterPanelRow`) | Browse pages with sort |
| Sort order (field row) | Removed from grid | — |
| Search | Leading **search** icon in field | Browse toolbars, global search |
| Grid / list toggle | **Deferred** — grid-only on `/cards` and `/commanders` | Backlog |
| Commander legal / Commanders only / Indexed only | **Toggle pills** (not checkboxes) | Catalog, Top cards, Set detail, Sets browse |
| Type contains, CMC min/max | Text + **compact number** fields (`~4.25rem`) | All card lists + set detail |
| Set detail sort | Collector #, Name, Rarity, CMC + order toggle | `/sets/[code]` |

Color filter uses **`colorIdentity`** (Commander identity), comma-separated in API `color=W,U` param.

Catalog/top-card **rarity** filter matches the oracle’s **lowest** printing tier across `set_cards` (not “any printing”). Set detail filters each printing row directly.

## Card detail (Phase 1.6 + 1.7)

```
[StaleCacheBanner?]
EntityDetailTabs (commanders only)
Hero + salt badge (sticky left column)
Stats (CMC, colors, prices USD from Scryfall) — DetailSectionPanel
Popularity (inclusion % or decks)
Oracle | Keywords
DetailSectionNav (vertical scrollable list under image; image shrinks when sticky)
**Unique-to-card sections first** (primary tint): top commanders, cardlists (unique), similar cards, relatives
CardListSection × N (shared buckets)
```

## Commander detail (Phase 1.6 + 1.7)

```
[StaleCacheBanner?]
EntityDetailTabs
Hero + SaltBadge + all-time rank (sticky left column)
Filter bar: Theme | Budget | Bracket — BrowseFilterPanel
Stats / Popularity / Oracle / Keywords — DetailSectionPanel
DetailSectionNav
**Unique-to-commander sections first** (primary tint): deck themes, high synergy, average deck, similar commanders
CardListSection × N (shared buckets)
```

### Card vs commander parity (list + detail)

| Element | Card | Commander |
|---|---|---|
| Browse rank | ✅ | ✅ |
| Browse salt | ✅ | ✅ |
| Browse primary metric | inclusion % | numDecks |
| Browse CMC + colors | ✅ | ✅ |
| Detail hero badges | Salt | Salt + **all-time rank** |
| Detail Stats | CMC, colors, USD | CMC, colors, USD |
| Detail Popularity | inclusion % / decks | decks |
| Detail EDHREC sections | top commanders, **cardlists** (top cards, game changers, type buckets), similar cards, relatives | themes, cardlists, similar commanders |

Sections that exist on **only one** of the two detail views (card vs commander) appear **first** in `DetailSectionNav` and in the main column, with a subtle tinted panel (`bg-primary/5`). Shared cardlist buckets (e.g. New Cards, Top Cards, Creatures) follow without emphasis. Stats / Oracle / Keywords stay at the top and are identical when both tabs exist.

## Components (target after 1.6)

Folder: `src/components/discovery/`

| Component | Phase | Use |
|---|---|---|
| `BrowseViewToggle` | backlog | Grid / list — not wired in 1.6 |
| `CardGridTile` | 1.6.1 | Browse grid cell |
| `CardFaceTile` | 1.6.20 | Image-first grid cell (browse + detail sections) |
| `CardFaceMetricFooter` | 1.6.20 | Inclusion / synergy / salt footer for EDHREC lists |
| `CardMetricRow` | 1.6.5 | *(replaced by `CardFaceTile` + footer in 1.6.20)* |
| `CardListSection` | 1.6.5 | One EDHREC cardlist block |
| `PopularityUnavailableBadge` | 1.6.1 | Production missing-meta badge |
| `CommanderFilterBar` | 1.6.14 | Theme / budget / bracket (commander) |
| `RankBadge` | 1.6.1 | `#42` on commanders |
| `SaltBadge` | 1.6.1 | Card detail |
| `PriceChip` | 1.6.16 | Scryfall USD |
| `DetailHeroBadges` | 1.6.16 | Salt + all-time rank on commander hero |
| `CardDetailCardlistSections` | 1.6.16 | EDHREC co-played cardlists on card detail |
| `DetailSectionNav` | 1.6.20 | Scrollable vertical section list; pairs with sticky aside image shrink |
| `DetailSectionPanel` | 1.7.1 | Shared panel wrapper for detail sections (Stats, Oracle, …) |
| `ManaSymbol` / `ColorIdentity` | 1.6.20 | MTG mana icons (filters + stats display) |
| `RarityIcon` | 1.6.20 | Rarity gems (filter + set grid) |
| `BrowseSortOrderToggle` | 1.6.20 | Asc/desc icon in `BrowseFilterPanelRow` |
| `SaltIcon` + `SaltBadge` | 1.6.20 | Salt shaker + value |
| `metric-icon-label` | 1.6.20 | Inclusion / synergy / decks icon prefixes |
| `EdhrecSimilarCards` | 1.6.16 | Card detail similar grid |
| Existing | 1.5 | `BrowseTabs`, `LoadMoreButton`, toolbars, rows, `EntityDetailTabs`, … |

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
| `/sets/[code]` | `CardFaceTile` grid; filters + **sort by** in `PageShell` toolbar |

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
- Light/dark toggle
- Command palette (`⌘K`)
