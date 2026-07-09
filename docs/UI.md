# EDHForge — UI guide

Living reference for layout and components. **Phase 1** discovery pages use this shell; **Phase 2+** deck workspace extends it (new sections below as built).

> Status: functional shell, not final visual design. Polish pass after Phase 1 demo data is solid.

## Principles

1. **Data-first** — pages read Postgres cache; no live EDHREC/Scryfall in render path.
2. **Reuse the shell** — new routes use `AppHeader`, `AppFooter`, `PageShell`; avoid one-off page wrappers.
3. **English only** (MVP) — labels, metadata, empty states.
4. **Attribution** — Scryfall + EDHREC links in footer; card images via Scryfall URLs.
5. **Progressive density** — discovery lists stay scannable; detail pages stack sections vertically.

## Layout

| Component | Path | Role |
|---|---|---|
| `AppHeader` | `src/components/layout/app-header.tsx` | Logo, main nav, active route highlight |
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

Pattern: **server page** loads data via `src/lib/edhrec/cache.ts`, passes props to presentational components. No fetch inside client components except future interactive search.

## Routes (Phase 1)

| Route | Layout notes |
|---|---|
| `/` | Marketing-lite home; links into discovery |
| `/cards`, `/cards/[slug]` | Search + grid; detail with EDHREC sections |
| `/commanders`, `/commanders/[slug]` | Browse + profile (rank, salt, tags, top cards) |
| `/sets`, `/sets/[code]` | Browse + card list with rarity/color/commander filters |

## Phase 2+ (to document when built)

- **Deck workspace** — separate layout width ok (`max-w-6xl`); sidebar + main editor; not a rewrite of discovery pages.
- **Auth chrome** — user menu in header; guest CTA for save/publish.
- **Analysis panels** — charts/tables inside deck context; reuse zinc card surfaces.

## Checklist for new UI work

- [ ] Uses `PageShell` (or documented exception)
- [ ] Breadcrumbs on detail pages
- [ ] Loading / empty / stale states considered
- [ ] No live external API in Server Component render
- [ ] Footer attribution unchanged unless product decision says otherwise
