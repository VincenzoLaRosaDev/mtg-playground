# EDHForge — UI guide

Living reference for layout and components. **Phase 1.5** discovery consistency spec: `docs/PROJECT.md` § Discovery consistency. Visual polish (1.5.9) follows behaviour work.

> Status: functional shell → **behaviour pass** (browse, search, detail) before final styling.

## Principles

1. **Data-first** — pages read Postgres cache; no live EDHREC/Scryfall in render path.
2. **Reuse the shell** — new routes use `AppHeader`, `AppFooter`, `PageShell`; avoid one-off page wrappers.
3. **English only** (MVP) — labels, metadata, empty states.
4. **Attribution** — Scryfall + EDHREC links in footer; card images via Scryfall URLs.
5. **Progressive density** — discovery lists stay scannable; detail pages stack sections vertically.
6. **Oracle first** — card always exists at `/cards/{slug}`; popularity stats are part of the catalog with neutral empty states.
7. **Parallel commander URLs** — `/commanders/{slug}` uses the same `EntityDetailTabs` (Card | Commander) as the card route; cross-route navigation, not duplicate layouts.
8. **Dev-only source transparency** — `CatalogDebugBadge` in development shows sync health; production UI does not surface upstream source names except footer attribution.

## Layout

| Component | Path | Role |
|---|---|---|
| `AppHeader` | `src/components/layout/app-header.tsx` | Logo, main nav, **global search**, active route highlight |
| `AppFooter` | `src/components/layout/app-footer.tsx` | Attribution + links |
| `PageShell` | `src/components/layout/page-shell.tsx` | `max-w-5xl` container, breadcrumbs, H1 + description |
| `mainNav` | `src/lib/navigation.ts` | Single source for header links |

### Page structure

```
AppHeader
main (PageShell)
  nav breadcrumbs (optional)
  header: h1 + description
  sections (discovery components, grids, tables)
AppFooter
```

### Width & spacing

- Content max width: `max-w-5xl` (header + pages aligned)
- Page padding: `px-4 py-10`
- Section gaps: `space-y-8` or `mb-8` between major blocks

## Tokens (current)

Defined in `src/app/globals.css` — minimal set until polish pass:

| Token | Light | Dark (`prefers-color-scheme`) |
|---|---|---|
| `--background` | `#ffffff` | `#0a0a0a` |
| `--foreground` | `#171717` | `#ededed` |

Tailwind zinc scale for borders, muted text, nav states. Fonts: Geist via Next layout vars; body fallback Arial.

**Polish backlog:** semantic colors (mana, salt warning), consistent `text-muted` utility, light/dark toggle (today: system only).

## Browse list pattern (Phase 1.5)

Reusable structure for `/cards`, `/commanders`, `/sets`:

```
PageShell
  [EdhrecSyncNotice]        ← cards/commanders layouts only
  Tabs (where applicable)
  Toolbar: sort | filters
  Result list (CardRow / CommanderRow / SetRow)
  [Load more] if nextCursor
```

| Page | Tabs | Default |
|---|---|---|
| `/cards` | Popular · All | Popular |
| `/commanders` | Ranked · All | Ranked |
| `/sets` | — | Recent releases |

**Load more:** append to list; show loading on button. Empty tab → short explanation + link to other tab if relevant.

**Commander badge:** removed from browse lists — catalog completeness is implied; use **Popularity data** filters when needed.

**Dev panel:** `CatalogDebugBadge` (fixed top-left, development only) — collapsible via ⛭ icon; popularity sync status, last success, source layering note.

**Dev coverage badges:** violet “No EDHREC data/meta” pills on browse **All** tabs when popularity overlay is missing (development only).

## Global search (navbar)

- Combobox or `/search?q=` results page
- Sections: **Cards**, **Commanders**, **Sets**
- Same slug in card + commander → one commander hit + one card hit, or single row with both links (pick one pattern in impl)
- Min 2 characters; debounce 250ms (match existing)

## Detail pages (Phase 1.5)

### `/cards/[slug]`

```
[StaleCacheBanner?]
Hero: image (respect ?set= override)
Stats | Oracle | Keywords
[Tab: Card | Commander]  ← Commander tab only if is_commander + EDHREC profile
  Card: Top commanders, Relatives, (future: synergy)
  Commander: themes, top cards, similar (reuse discovery components)
Link: "View commander page" → /commanders/{slug}
```

### `/commanders/[slug]`

```
[StaleCacheBanner?]
Same hero + EDHREC stats block
Themes | Top cards | Similar
Link: "View card page" → /cards/{slug}
If no EDHREC: card shell + banner (not 404)
```

### Set → card navigation

Set list links: `/cards/{slug}?set={setCode}` so hero image matches list thumbnail.

## Discovery components

Folder: `src/components/discovery/`

| Component | Use |
|---|---|
| `CardImage` | Scryfall image with correct aspect ratio |
| `EdhrecTopCards` | Commander top cards list |
| `EdhrecSimilarCommanders` | Similar commander chips |
| `EdhrecTopCommanders` | Card page — commanders that play it |
| `CardRelativesBySubtype` | Card page — other cards sharing subtype(s) from catalog |
| `StaleCacheBanner` | Detail pages — failed on-demand EDHREC refresh |
| `EdhrecSyncNotice` | Browse routes — weekly sync failed or stale (&gt;8d) |

**Phase 1.5 (added):** `BrowseTabs`, `LoadMoreButton`, `CardBrowseToolbar`, `CardBrowseRow`, `CommanderBrowseToolbar`, `CommanderBrowseRow`, `SetBrowseToolbar`, `SetBrowseRow`, `GlobalSearch`, `CardDetailTabs`, `CardCommanderPanel`, `DetailCrossLinks`, `NoEdhrecMetaBanner`.

Pattern: **server page** loads data via cache/Prisma; client islands for tabs, search, load more. No live EDHREC/Scryfall in browser except via our APIs.

## Routes

| Route | Layout notes |
|---|---|
| `/` | Marketing-lite home; links into discovery |
| `/search` | Unified search results (Phase 1.5) |
| `/cards` | Tabs + browse; not search-only |
| `/cards/[slug]` | Oracle detail + optional commander tab; `?set=` image |
| `/commanders` | Ranked / All tabs + load more |
| `/commanders/[slug]` | Commander profile; parallel to card |
| `/sets` | Paginated browse + sort/filters |
| `/sets/[code]` | Card list with filters; links include `?set=` |

## Future UI (backlog)

- **Printings tab** on card detail — grid of arts from `set_cards` / future printings table; pick default view
- Command palette (`⌘K`) — optional upgrade to global search

## Phase 2+ (to document when built)

- **Deck workspace** — separate layout width ok (`max-w-6xl`); sidebar + main editor; not a rewrite of discovery pages.
- **Auth chrome** — user menu in header; guest CTA for save/publish.
- **Analysis panels** — charts/tables inside deck context; reuse zinc card surfaces.

## Checklist for new UI work

- [ ] Uses `PageShell` (or documented exception)
- [ ] Breadcrumbs on detail pages
- [ ] Loading / empty / stale states considered
- [ ] No live external API in Server Component render
- [ ] Browse tabs + load more on list pages
- [x] Global search in header
- [x] Card/commander cross-links and commander tab
- [ ] `?set=` propagated from set pages
- [ ] Footer attribution unchanged unless product decision says otherwise
