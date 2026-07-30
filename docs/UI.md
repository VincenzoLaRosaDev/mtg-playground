# MTGPlayground — UI guide

Living reference for layout and components. Historical Phase 1.6–1.8 discovery chrome remains below; **product end-state** is the MTGPlayground pivot (`docs/PROJECT.md`, `docs/DECISIONS.md` 2026-07-20).

> Status: Phase **3** Analysis ✅ (in-builder) · next **Phase 4** Community.

## Pivot UI principles (current)

1. **Printing-first** — version picker (set / art / foil) is a core pattern, not collection-only.
2. **Single card detail** — one oracle page at `/cards/{slug}`; `/commanders/{slug}` redirects.
3. **Multiface** — staggered front/back stack on detail + tiles; hover the back face to bring it forward.
4. **Honest EDH Inclusion** — Scryfall Commander **deck inclusion** rank only; never “as commander” popularity. UI label: **EDH Inclusion**.
5. **Commanders browse** — legality filter (name-first); not a meta ranking hub.
6. **Collection + decks + precons** — owned/missing in builder and precon detail (Phase 2.1–2.3). In-app card opens use the unified **card detail modal**; `/cards/{slug}` PDP stays for SEO/share (**Go to page**). Modal Related cards collapse mirrors PDP lists (As card / As commander + sticky TOC; denser sheet grids). Modal and PDP share **Collection | Decks** manage columns. Default deck = current editor page when present, else last visited/modified (`mtgplayground.lastDeckId`). **`/precons`** browse + detail (fork to private deck).

## Principles (legacy EDHForge discovery)

1. **Data-first** — browse/search read Postgres only.
2. **Reuse the shell** — `AppHeader`, `AppFooter`, `PageShell`; shared discovery components across routes.
3. **English only** (MVP) — labels, metadata, empty states.
4. **Attribution** — Scryfall (+ WotC) in footer; no EDHREC.
5. **Mobile-first, desktop-dense** — sticky header / section jump as today.
6. **Oracle hub + printings** — card at `/cards/{slug}` with Version picker (`?set=` / `?cn=` / `?finish=`).
7. ~~Parallel commander URLs~~ — **deprecated** by pivot; merge into single detail.
8. **Neutral EDH Inclusion copy** — inclusion-rank wording; no fake commander meta.

## Layout

| Component | Path | Role |
|---|---|---|
| `AppHeader` | `src/components/layout/app-header.tsx` | Logo, search, desktop nav / mobile menu |
| `MobileNavSheet` | `src/components/layout/mobile-nav-sheet.tsx` | Hamburger → `Sheet` (`side="bottom"`) with `mainNav` + auth (`lg:hidden`) |
| `SignInSheetProvider` | `src/components/auth/sign-in-sheet.tsx` | Primary sign-in UX — sheet (`size="sm"`); `/signin` bridges to the sheet (Auth.js `pages.signIn` only). **Sign out** from `/collection` or `/decks/*` goes to `/` so SignInGate does not reopen the sheet |

| `AppFooter` | `src/components/layout/app-footer.tsx` | Attribution |
| `PageShell` | `src/components/layout/page-shell.tsx` | Container, breadcrumbs, H1. **Breadcrumbs:** every PageShell route except `/` — `Home` first, then section, then current on detail (`Home / Sets / {set}`, `Home / Browse / {card}`, …). List hubs: `Home / Browse`, `Home / Sets`, `Home / Search`, `Home / Precons`, … |
| `ListFilterAccess` | `src/components/layout/list-filter-access.tsx` | Dual list filters: inline panel + portals tongue/drawer into sticky `#site-header-chrome`; mounts `BackToTop` |
| `BackToTop` | `src/components/layout/back-to-top.tsx` | Fixed FAB — always centered, `bottom-4` (same as catalog debug); appears after ~400px scroll |
| `ScrollToTopOnPathnameChange` | `src/components/layout/scroll-to-top-on-pathname.tsx` | Window → top on pathname change (not query-only; not browser back/forward). Clears sheet body-scroll restore so unlock after in-sheet Links (e.g. Go to page) cannot reapply the old `scrollY` |
| `mainNav` | `src/lib/navigation.ts` | Header links |

### Width & spacing

- Content max width: **`max-w-7xl`** (`siteContainerClassName` in `src/lib/ui/layout.ts`) — header, footer, `PageShell`
- Page padding: `px-6`, vertical `py-10` / `lg:py-12`
- **Sheets (`SheetContent`, `side="bottom"`):** below `lg` = full-bleed bottom sheet; `lg+` = centered dialog (`rounded-xl` + border, shared blur overlay). Optional `size`: `sm` (`max-w-md`) · `md` (`max-w-2xl`) · `lg` (`max-w-4xl`, default). Sign-in / import / **confirm** (`ConfirmDialog`) / **create deck** → `sm`; card peek → `md`; add / versions / workspace search → default `lg`. Prefer `ConfirmDialog` over `window.confirm`. Nested sheets (e.g. Versions over `CardDetailModal`) keep their own backdrop via Base UI `forceRender` on `SheetOverlay` so outside-press dismiss works.
- Sheet list hairlines: **`SHEET_LIST_RULE_CLASS`** on the `siteContainer` header (or **`SITE_GUTTER_BLEED_X_CLASS`** when the rule sits inside a padded container) so search / versions / import dividers share the same width
- **Collection list:** scope tabs All / Owned / Wish + **Sort by** (Last modified · Last added · Name · Set & collector # · CMC · Color & CMC · Price) with order toggle (`?sort=` / `?order=`) + catalog-like facets (`q`, `color`, `type`, `cmc_*`, `rarity`, `format`, `finish`, `set`) in `BrowseFilterPanel`; grid is **paginated** (48 + Load more via `/api/collection`)
- Filter chrome: shadcn `Input`, `Select`, `Label` (dense `text-xs` labels) via `BrowseSearchField` / `BrowseSelectField` — not native `<input>` / `<select>`
- Filter toggles: shadcn `Toggle` / `ToggleGroup` (mana, rarity, option pills); sort order uses `Button` icon
- Sticky below header: `--site-header-height` (set by `AppHeader` ResizeObserver) + `SITE_STICKY_BELOW_HEADER_CLASS`
- **AppHeader:** solid `bg-background` + `border-b` (no backdrop blur / translucency)
- **List scroll chrome** (`/browse`, `/sets`, `/sets/[code]`, `/collection`, `/precons`): full filter panel stays inline at the top. Tongue/drawer appear only after the **entire** inline toolbar has scrolled above the sticky nav. They portal into `#site-header-chrome` as **absolute** children of an `h-0 w-full` slot (sticky height stays nav-only). Drawer mounts only while open; chrome is **full-bleed** (`border-b` edge-to-edge); inner filters use `siteContainerClassName` + `py-3` so content matches the in-page max-width. `BrowseFilterPanel` skips Card chrome via `ListFilterDrawerContext`. Tongue is **centered** in site gutters, bottom-only radius; when closed it sits below the header border (does not cover it) with a solid fill; when open, `-mt-px` + 1px background seam cover tuck into the drawer `border-b`; idle fill is solid `background`, hover is `bg-gradient-to-t from-muted to-background` (hover color at bottom → bg at top). Open/close: one `translate3d` block (drawer + tongue); clip height is instant (iOS skips `height` transitions); `cubic-bezier(0.4, 0, 0.2, 1)`. While open (mobile + desktop): body scroll locked; sheet-like scrim (`z-35`, under sticky header `z-40`) captures outside taps — dismiss only, no click-through to cards; Escape / tongue / scrim close. **Back to top** FAB (`z-30`): always centered, `bottom-4`; hidden near page top. Not used on `/search` or card detail.
- Notices: shadcn `Alert` (`StaleCacheBanner`, `EdhrecSyncNotice`, `FilterUnavailableNotice`)
- Card grids: browse `CARD_FACE_GRID_CLASS` (`2 / md:3 / lg:4 / xl:5 / 2xl:6 / 3xl:7`); detail sections `CARD_FACE_DETAIL_GRID_CLASS` (`2 / md:3 / lg:3 / xl:4 / 2xl:5 / 3xl:6`) beside sticky TOC; without TOC use `CARD_FACE_DETAIL_GRID_WIDE_CLASS` (+1 col from `lg`) so full-width lists don’t oversize tiles. Modal sheet density: `CARD_FACE_DETAIL_GRID_SHEET_*` (one column denser; same wide/TOC split)
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
| `--info` / `--info-foreground` | Wish / notices (teal); wish buttons use label opacity, not solid fill |
| `--destructive` | Errors, salt high |
| Rank badge | `RankBadge` → shadcn `Badge` (primary) |
| Salt badge | Shaker icon + numeric value (warning / destructive tones) |
| Mana symbols | `ManaSymbol` / `ColorIdentity` — vendored Scryfall SVGs |
| Rarity symbols | `RarityIcon` — inline gem SVGs |
| Generic UI icons | `lucide-react` via `src/components/ui/icon.tsx` |

**Already centralized (keep using these, don’t re-hardcode):**

| Concern | Where |
|---|---|
| Site max-width / gutter | `src/lib/ui/layout.ts` (`siteContainerClassName`, `SITE_GUTTER_BLEED_X_CLASS`, `SHEET_LIST_RULE_CLASS`) |
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

Full catalog browse: **`/browse`**, **global search** (`/search` — same card/set grids; navbar typeahead **8** hits, View all **50**), and **sets** (`/sets`).

### Grid tile (default)

Shared **`CardFaceTile`** — full-width card image (`CardMultifaceImage` / `CardImage` grid variant, proportional corner radius) + optional footer metrics. No outer border. Multiface cards show a **staggered front/back stack**; hover the back (offset strip) to raise it.

- Footer: Scryfall **Price** + **EDH Inclusion** (rank) on cards and commanders browse (EDH Inclusion = deck inclusion, not “as commander”)
- **Collection / deck tiles:** footer meta row is `justify-between` — **info** (single finish price · `SET #cn`) | **label** (Owned/Wish or Owned×/Missing×). Deck Owned× uses emerald owned chrome (`LABEL_OWNED_CLASS`, same as modal/PDP); Missing× keeps warning + `+×N` collect. Collection CTAs: qty + Get (wish only) + Remove — no Add to wish on owned tiles.
- **Qty inputs** site-wide share `QTY_INPUT_WIDTH_CLASS` (`w-8` → `sm:w-10`): room for ~2 digits on narrow viewports, ~3 when wider.

Detail sections (role staples, relatives) use the same tile + `CARD_FACE_DETAIL_GRID_CLASS`, or `CARD_FACE_DETAIL_GRID_WIDE_CLASS` when the lists band has no sticky TOC. Set detail uses browse `CARD_FACE_GRID_CLASS`.

### Deck list (`/decks`)

Toolbar: deck quota + primary **New deck** → `CreateDeckDialog` (`size="sm"` sheet: name, format). No inline create form; legacy `/decks/new` redirects here.

Grid of preview cards (`CARD_FACE_GRID_CLASS` — same column breakpoints as browse/collection card grids, denser than sets/precons):
1. **Cover art** — Scryfall `art_crop` (artwork only, via `toScryfallArtCropUri` on the stored normal URI); pick commander (first by name if partners) → else highest-CMC non-land main → else first main; preferred printing → catalog image. Landscape `aspect-3/2` so height scales with the narrower tile width.
2. **Overlay** on art — `Format · sizeLabel · relative updated` (no views). Size uses `N M · S S`.
3. **Cost mana share bar** — same pip semantics as Colors · Cost (`summarizeDeckManaPips`); compact `ManaShareBar`.
4. **Footer** — whole card is the editor link; footer row is deck name + Delete (right-aligned). Delete sits above the stretched link + confirm dialog.

### Deck editor (`/decks/[id]`)

**Two presentations** via `DeckViewToggle` (List default · Grid): preference in `localStorage` key `mtgplayground.deckEditorView`.

- **Grid:** `CARD_FACE_GRID_CLASS` + `CardFaceTile` — same density as browse/collection. Tile footer: price · set#cn | Owned/Missing (+ collect); qty, board select, Remove; face click opens the deck-mode detail modal.
- **List (Goldfish-style):** dense rows — qty · name · mana cost · Owned/Missing chip (+ `+×N` collect when missing, same as grid) · price · board · Remove. Single multi-column flow (`columns-1 sm:columns-2 xl:columns-3`, `column-fill: balance`) across **all boards** (Main → Sideboard continuous). **Main** type subsections may **split across columns** so heights balance; headings use `break-after-avoid` (no orphan titles). Rows stay `break-inside-avoid`. **Sideboard** is flat CMC→name. Hover on **name** (fine pointer) shows floating art preview that follows the cursor (viewport-clamped); **click name** opens the detail modal. Helpers: `ManaCost` / `parseManaCost`, `CardNameWithHoverPreview`, `DeckCardList`.

Boards stay **Commander / Companion / Main / Sideboard** in the list/grid. **Main** splits into Goldfish-style type subsections (Creature → Planeswalker → Instant → Sorcery → Artifact → Enchantment → Battle · Land · Other); within each group sort **CMC then name**. Sideboard / Commander / Companion are flat (CMC → name). Meta panel (name/format/legality/Add) sits in `ListFilterAccess` with `showFilterTongue={false}` so **Add cards** sticks under the header once the panel scrolls away. **Deck stats** sit **below the card list/grid** (not in the sticky meta): header Size · Avg MV · Est cost · Lands; **Overview** first on its own row (full width, `2xl:max-w-[50%]` on very large screens); then two pair rows — **Colors | Mana curve**, **Quantities | Odds** — each `grid-cols-1` → `lg:grid-cols-2` with `items-start`; Odds table `max-h` + scroll so Card Name lists don’t blow the column. Below stats: **Deck Tokens & Extras** (`DeckTokensExtrasSection`, read-only) — stacked **Tokens** then **Extras** (inferred; hide empty groups/section); same `DeckViewToggle` List/Grid as the deck/precon (shared localStorage preference), with a Goldfish-style name row in list mode. **Colors:** Cost/Production share bars + WUBRG(+C) cards with % bars, pip/mana counts, Scryfall-tinted fills; toggles for colorless + lands-only production (`DeckColorsStats`). **Mana curve:** Avg/Total MV + overall chart + “Mana curve by” (Color · Permanent/non-permanent · Roles · Types · Subtypes · Rarity) with mini-curves (`DeckCurveStats`); multicolor/multi-role/multi-subtype spells appear in each matching series; subtypes capped (top 12 + Other). **Quantities:** “Quantity of” select — Roles · Types · Subtypes · Supertypes · Mana value · Keywords (`DeckQuantitiesStats`); one facet at a time, horizontal bars. **Odds:** “Probability of drawing” At least|Exactly · K · by (Card Name · Roles · Types · Subtypes · Mana value · Keywords) · N cards; default by **Types** on commander-like, **Card Name** on multi-copy formats; table Label/Qty/Odds (`DeckOddsStats`). No power/toughness facet; no salt/bracket parity; no separate analysis page. Type grouping: `src/lib/decks/card-type-groups.ts`.

### Sets browse

Preview cards in `CARD_FACE_GRID_CLASS` (browse density): `art_crop` of the **first indexed printing** (lowest collector number with image), overlay type · indexed/cards · release, footer **set icon** + name/code. Shared shell `CatalogPreviewCard`. No mana bar. `/search` set hits use the same card + grid.

### Precons browse (`/precons`)

PageShell + ListFilterAccess with shared `BrowseFilterPanel`. Filters: search (name · set code · **set name** · **commander name**) · sort · format · **type** · **color identity** pills (WUBRG+C; selected colors must all appear on denormalized precon CI — commander union, else mainboard non-land). Same preview-card grid as sets/decks: commander/cover `art_crop`, Cost mana share bar, set icon + name; whole card links to PDP. Load-more via `/api/precons/search`.

### Precon detail (`/precons/[slug]`)

Hero: name, type/format, set code, release; **Fork to deck** CTA (SignInGate for guests). Owned/missing line → list/grid (`PreconDeckView`: **List | Grid** toggle, own `mtgplayground.preconDeckView`; boards + Main type groups like the editor; Owned/Missing when signed in; name/tile opens `openCardDetail`) → **`DeckInsightsPanel`** (“Precon stats”) → **`DeckTokensExtrasSection`** (Tokens from relations + MTGJSON product tokens; Extras tab hidden on precon). No legality strip on PDP (fork + editor enforce).

### Search results

**Cards:** `CARD_FACE_GRID_CLASS` + `CardGridTile`. **Sets:** same preview cards as `/sets` (`CatalogPreviewCard` / `SetBrowseRow`).

## Browse filters (Phase 1.8)

Shared **`BrowseFilterPanel`** styling on all list pages. Grid tokens live in `browse-toolbar-shared.ts`. **Browse hub** uses two field rows: primary (`browseToolbarHubPrimaryGridClassName` — search · sort · type · CMC) and secondary (`browseToolbarHubSecondaryGridClassName` — Role · Theme · Format, equal columns). Pill row uses shared `browseToolbarPillGroupsClassName` (Color / Rarity / Options hug content with `gap-3`, same on hub, cards, set detail, collection). CMC min/max are one grid cell (`browseToolbarCmcPairClassName`). **Sets browse** uses `browseToolbarDenseGridClassName`; **set detail** uses `browseToolbarSetDetailGridClassName` (includes Format). Pill groups sit on a second row in **`BrowseFilterPanelRow`** with **Clear filters** (when active) immediately left of the sort-order icon on the right.

| Control | Style | Pages |
|---|---|---|
| Field label | `text-xs` muted, `mb-1` — same for search, select, text | All browse toolbars |
| Field height | `h-8` unified (search, select) | All browse toolbars |
| Color identity | Multi-select **mana symbol** buttons (W/U/B/R/G/C) | Top cards, Top commanders, Catalog, Set detail |
| Rarity | Multi-select **rarity gem** buttons | Top cards, Catalog, Set detail |
| Sort order | **Arrow up/down** icon — right side of last filter row (`BrowseFilterPanelRow`) | Browse pages with sort |
| Sort order (field row) | Removed from grid | — |
| Search | Leading **search** icon; matches **name, type, oracle text** (FTS) | Browse toolbars, global search |
| Grid / list toggle | **Deck editor only** (`DeckViewToggle`); browse/collection stay grid | `/decks/[id]` |
| Format | Select — curated Scryfall keys; filter `legalities[format] === "legal"` | `/browse`, set detail |
| Sort by | **EDH Inclusion** / **Color & CMC** / Name / CMC / Price | `/browse` |
| Sort defaults | Format Any or Commander → EDH Inclusion; other formats → Color & CMC; Options Commander on → Name | `/browse` |
| Commander (hub) | **Toggle pill** — `isCommander` (can be your commander), not format legality | `/browse` Options (**first**) |
| Type contains, CMC min/max | Text + **compact number** fields (`~4.25rem`) | All card lists + set detail |
| Set type | Select from **distinct** `mtg_sets.set_type` | `/sets` |
| Role / Theme | Select from product enums, **hide-empty** vs `card_classifications` | `/browse` |
| Set detail sort | Collector #, Name, Rarity, CMC + order toggle | `/sets/[code]` |

Color filter uses **`colorIdentity`** (Commander identity), comma-separated in API `color=W,U` param.

**EDH Inclusion** on browse tiles is Commander deck inclusion from Scryfall. Sort label is **EDH Inclusion**. Tile footer hides EDH Inclusion when Format is a non-Commander constructed format **and** sort is not EDH Inclusion (avoids implying Modern/Pioneer popularity).

Catalog/top-card **rarity** filter matches the oracle’s **lowest** printing tier across `printings` (not “any printing”). Set detail filters each printing row directly.

## Card detail (Phase 1.6–2.0)

Printed-card facts (CMC, colors, oracle, keywords) are **not** duplicated in the main column — they live on the card image.

**Two bands:**

1. **Overview** — image + set/cn caption | details panel filling the fluid column: **Status | Roles | Themes** (stack under `lg`; from `lg` fixed 3-col track — when a section is missing the last block spans the leftover columns, e.g. 1+2, never an empty slot) → **Market** (prices) → **Printing** (shared with the modal: **Version** + **Show all versions** in a flex-wrap pair matching select `h-8`, capped at `max-w-md` so a missing Finish doesn’t stretch full width; when Finish is present, same 3-col track — stack under `lg`; from `lg` Version 2 / Finish 1; under that **CardCollectionPanel**: Qty + **Add owned** (primary) / Add to wish for the active printing+finish, plus oracle rollup + linked “Your copies” list). Overview column is fluid (no column `max-w`); constrain Version/Finish only.
2. **Lists** — related sections; sticky **DetailSectionNav** (lg+) / **DetailSectionJump** (mobile) on the left of the lists band (not under the image)

**As card / As commander:** When `isCommander`, an outline **As card | As commander** ToggleGroup (active = primary **label** chrome: full `border-primary` + `bg-primary/15`; larger than Finish toggles) switches list packs via `?view=commander` (default = card). Non-commanders have no toggle and always show card lists. Version params (`set` / `cn` / `finish`) are preserved across view switches.

| View | Sections |
|---|---|
| As card | Similar cards · Relatives by subtype |
| As commander | Role staples (per role) · Game Changers in CI · Build skeleton |

**Version URL:** `/cards/{slug}?set={code}&cn={collector}&finish={foil|etched}&view=commander`. Bare `/cards/{slug}` still resolves the catalog-default printing and pre-selects it in the VersionPicker (no separate “Catalog default” option). Set pages link with `set`+`cn`. Nonfoil omits `finish`. Foil/etched add a CSS sheen on the hero image (same Scryfall art URI). **Collection grid** passes `finish` into `CardFaceTile` (wash always; glare on hover only — no idle loop across many tiles). Foil glare **crossfades** idle sweep ↔ pointer follow (~400ms opacity) so tilt enter/leave is not a hard cut. Browse / catalog search stay non-foil.

**Show all versions:** Sheet (~85dvh; centered dialog on `lg+`) with browse-like `CardFaceTile` grid (art + `SET #cn · set name` + EUR prices). One tile per printing (`set`+`cn`); Finish stays on the VersionPicker Finish control. Trigger uses Button `default`/`h-8` to match the Version `SelectTrigger`, and sits in a flex-wrap pair with the select (`DETAIL_PRINTING_VERSION_GROUP_CLASS`) so the two stack when the pair runs out of width. **PDP and modal** both lazy-load the full printing list via `loadOraclePrintings` when Show all versions is requested (or when the Version select is first interacted with); the sheet **opens only after** printings are ready (no skeleton). On the **PDP**, tile click navigates with `buildCardVersionHref`. In **`CardDetailModal`**, `onSelectPrinting` updates the modal preview. Trigger only when more than one printing (`printingCount`).

**Workspace overlays (Phase 2.2+):** Sheets cap at **`max-h-[85dvh]`** (bottom sheet `< lg`, centered dialog `lg+`). **`CardDetailModal`** (`size="xl"`) is the site-wide card overlay: stays **closed until** `loadCardDetailModal` returns, then shows header (name + type + **Go to page** / **Go to set**; close absolute top-right on mobile, aligned with the action row from `sm+`) → hero grid (`CARD_DETAIL_MODAL_HERO_GRID_CLASS`: full-width art under `sm`, 16rem column from `sm` | **Status | Roles | Themes** via `ClassificationBadges` (stacked under `lg`, one row from `lg`); **Printing** via shared `VersionPicker` (Version + Show all versions, then Finish) — same as the PDP; nested **`VersionsBrowser`** loads printings first, then opens (no skeleton). Initial fetch loads only the active printing. **Manage band** (**Collection** | **Decks**) via `CardManagePanels` — stacked below `lg`, two columns from `lg` (same on modal + PDP): owned/wish qty + copies list, and deck `<Select>` + Add to main/sideboard + in-deck lines. Deck default = workspace deck (editor page) when registered, else `mtgplayground.lastDeckId`, else most recently updated deck; select stays visible on the deck page. Collection page / deck editor still register workspaces so successful adds can close the modal. Below the hero, **Related cards** collapse loads packs on open, then reuses **`CardDetailLists`** (`variant="sheet"`): As card / As commander toggle (in-place), sticky section jump + lateral TOC, denser `CARD_FACE_DETAIL_GRID_SHEET_*` columns (still +1 when no TOC). Tile clicks replace the current modal. Finish is a **ToggleGroup** (`outline` / `sm`, active = primary label chrome) when the printing has multiple finishes. Deck and collection add search share **`WorkspaceSearchPanel`** (whole-tile click; result body uses `SHEET_CARD_GRID_BODY_MIN_H_CLASS`). Primary tile clicks open the modal; `href` remains for middle-click / open-in-new-tab to `/cards/{slug}`. Opening detail from **global typeahead** or **workspace Add cards** keeps the search surface open underneath (dismiss without adding returns to the same list); a successful workspace add still closes both via `onSuccessfulAdd`. Collection list tiles stay **one chip per row** (Owned / Wish). See `docs/DECISIONS.md` 2026-07-28 / 2026-07-30.

### Loading (block-fino-ai-dati)

**Default for every PageShell route:** block until data is ready — no `loading.tsx`, no page-level Suspense fallback UI, no fake result grids. Soft navigation keeps the previous page until the new RSC (or client payload) arrives, same feel as `/decks`.

**Soft-nav feedback:** a thin full-width **top progress bar** (`NavigationProgress`, `bg-primary`, ~2px, no spinner) starts on same-origin `<a>` / `Link` clicks (capture phase — Next soft-nav also `preventDefault`) and completes when the URL leaves the click origin (brief 100% hold). **Anti-flash:** show only after **100ms** so fast/prefetched navigations do not blink. Links that open overlays instead of navigating set `data-nav-progress="skip"` (tile → modal, search hits, signed-out `RequireAuthLink`). Not a page skeleton. Programmatic `router.push` / `replace` do not start the bar unless a caller invokes `startNavigationProgress()`.

**On-demand overlays (card detail modal, Versions browser):** do **not** open the sheet until the catalog payload is ready — no skeleton flash. On modal open, pass tile `imageUri`/`faces` and **`preloadImage`** the front face while `loadCardDetailModal` runs so art is warm when the sheet appears; collection / deck snapshots load after open (`loadCardDetailModalUserData`) with a short pulse on inventory chrome only. Workspace / global search keep hit skeletons inside an already-open surface.

**Detail heroes (PDP + modal):** `CardMultifaceImage` / `CardImage` use Next `priority` + `fetchPriority="high"` on the front face. Multiface back face is always mounted (lazy fetch); hover only raises it.

**Lists already mounted:** keep previous results until the new payload swaps in. `aria-busy` is fine; **do not** dim with `opacity-60` or swap in a pending slot.

**PDP:** await hero band (printing seed + classification + collection in parallel); lists stream via `CardDetailListsDeferred` with `fallback={null}`. Printings/versions stay lazy (open after load).

Filtered lists share `ListFilterAccess` + `PageListMeta` chrome. Shared overlay primitives live in `loading-skeletons.tsx` (barrel `card-grid-skeleton.tsx`).

**Card tilt:** Detail + grid previews use CSS 3D pointer tilt (`CardTilt` via `CardMultifaceImage`). Thumbnails stay flat. Respects `prefers-reduced-motion`; no continuous tilt on touch.

**Click targets:** Set browse rows (`SetBrowseRow`) are full-surface links (no card art). Card tiles (`CardFaceTile`) link the face image only — footer metrics stay outside the hit target. Interactive chrome (`Button`, `Toggle` / filter pills & mana/rarity, `Select`, dropdown items, `TabsTrigger`) uses `cursor-pointer`. Native `<button>` / `[role="button"]` also get the hand cursor via a base CSS rule in `globals.css` (covers collection add tiles, workspace search pick, scope tabs, etc.).

**Mobile (`< sm`):** overview (full-width image → meta stacked) → optional view toggle → sticky `DetailSectionJump` → sections.

**From `sm`:** overview image | meta (`DETAIL_HERO_GRID_CLASS`, **300px** image column). Modal uses the same `sm` split with a narrower 16rem column (`CARD_DETAIL_MODAL_*`).

**Desktop (`lg+`):** lists band uses sticky TOC + sections (`DETAIL_LISTS_GRID_CLASS`) when there are ≥2 sections; section jump hides in favor of `DetailSectionNav`. With no TOC, list card grids use `CARD_FACE_DETAIL_GRID_WIDE_CLASS` (+1 column from `lg`) so tiles stay browse-sized.

```
Overview: image + set/cn | Status | Roles | Themes → Market → Version + Show all / Finish
Lists: [As card | As commander full-width]? → sticky DetailSectionNav (lg+) | sections for active view
```

`/commanders/[slug]` permanent-redirects to `/cards/[slug]` preserving version params (Phase 2.0.4 / 2.0.7). Related parts remain removed from the **card** PDP; `all_parts` token/extra edges power deck/precon Tokens & Extras. Deck-builder insights (Phase 2.2.6) may still reuse the same D2 helpers.

## Commander detail (archive — dual routes superseded by 2.0.4)

~~Parallel `/commanders/[slug]` detail + route-switching Card \| Commander tabs~~ — removed. List packs return on the single `/cards/[slug]` hub via **As card / As commander** (`?view=commander`) when `isCommander`. Browse uses a **Commander** Options pill (`commanders_only` / `isCommander`), not a Cards \| Commanders entity tab.

### Card vs commander parity

| Element | Card detail (current) | Notes |
|---|---|---|
| Canonical URL | `/cards/{slug}` | `/commanders/{slug}` redirects here |
| EDH Inclusion rank | ✅ | Deck inclusion — not “as commander” popularity |
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
| `MobileNavSheet` | mobile-first | Header hamburger → sheet (bottom `< lg`; trigger `lg:hidden`) |
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
| `/cards/[slug]` | Sole oracle hub; EDH Inclusion + Legal commander chip |
| `/search` | Card grid (`CARD_FACE_GRID_CLASS` + `CardGridTile`) and set grid (`SET_BROWSE_GRID_CLASS` + `SetBrowseRow`) — same tiles as browse / sets |
| `/sets` | Horizontal set cards in wide grid; dense filter toolbar |
| `/sets/[code]` | `CardFaceTile` grid; footer is centered collector `#` only; filters + **sort by** in toolbar |
| `/precons` | Constructed precon browse (MTGJSON); q / format / sort |
| `/precons/[slug]` | Checklist + owned/missing + Fork to deck |

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
