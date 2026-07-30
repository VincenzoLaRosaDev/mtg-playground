# MTGPlayground — Decision Log

Append-only log of significant product and technical decisions.
**Never delete entries** — add superseding entries if a decision changes, or move fully-superseded material to `docs/DECISIONS-ARCHIVE.md` (never delete outright).

**Archive note (2026-07-24):** Pre-pivot history (2026-07-08 → 2026-07-20, the EDHREC-era commander-only EDHForge product) moved to `docs/DECISIONS-ARCHIVE.md` — `docs/PROJECT.md` already documents that era as non-current. This file now starts at the **2026-07-20 pivot to MTGPlayground**. A couple of same-day decision chains that iterated 3–7 times on one feature are also condensed here to their final state, with the full step-by-step history kept in the archive (linked inline below).

Format for new entries:

```markdown
## YYYY-MM-DD — Title
**Context:** Why the question came up.
**Decision:** What we chose.
**Consequences:** Impact on code, UX, or roadmap.
**Supersedes:** (optional) link to earlier entry this replaces.
```

---

## 2026-07-20 — Pivot to MTGPlayground (catalog + collection + multi-format)
**Context:** Without EDHREC/partnerships there is no legal Scryfall-like source for "as commander" popularity. Continuing as an EDHREC-style commander center would misrepresent `edhrec_rank` (deck inclusion, not commander choice). Product direction shifts toward Archidekt-like ownership tools.

**Decision:**
1. **Product name:** **MTGPlayground** (repo/package rename is a follow-up ops task; docs use the new name now).
2. **Positioning:** Catalog + personal collection + multi-format deck building; not an external meta commander center.
3. **Formats:** Deck builder supports **all major constructed formats** (not Commander-only). Commander remains a first-class format, not the sole scope.
4. **Printing-first site-wide:** Manage card **versions** everywhere (set, artwork/collector number, foil/nonfoil/etched) like Archidekt — not only in collection. Collection grain is **printing-level** (option B).
5. **Multiface:** First-class UI for DFC/MDFC/transform/split/etc. One physical printing / one deck oracle slot; render faces from Scryfall `card_faces`.
6. **Single card detail:** Remove parallel Card \| Commander detail routes/tabs. One oracle hub with version picker + face toggle. Former commander D2 blocks (roles, GC, friction, relations, staples/skeleton) are **deferred into deck-builder insights**, not a second "commander view".
7. **Popularity:** Keep Scryfall inclusion rank on **cards** with honest copy; do **not** present it as commander popularity.
8. **Community:** Keep publish + multi-axis ratings + rankings from the original plan, refined for **multi-format** and based on **platform corpus only** (no scraped meta).
9. **Data sources:** Scryfall (oracle + printings sync) + MTGJSON (precons) + user collection/decks. No EDHREC/Moxfield/Archidekt scrape.

**Consequences:** Roadmap reorders around printings schema, collection, multi-format decks, then analysis/community. Browse commanders-as-meta hub is deprecated. Neon storage/sync cost rises when full printings are indexed. WotC Fan Content Policy + Scryfall rules still apply (no paywall on card data).
**Supersedes:** Commander-only MVP (2026-07-08); Phase 1.8 dual card/commander detail as product end-state; "commander center" discovery framing in PROJECT/AGENTS. Full pre-pivot history: `docs/DECISIONS-ARCHIVE.md`.

## 2026-07-20 — Package/UI rebrand to MTGPlayground (Phase 2.0.2)
**Context:** Docs already used MTGPlayground; UI, npm package name, and Scryfall User-Agents still said EDHForge.
**Decision:** Rename user-facing brand and `package.json` to **MTGPlayground** / `mtgplayground`. Update SEO defaults and Scryfall User-Agent to `MTGPlayground/1.0`. Leave GitHub repo URL and local folder as `edhforge` until a separate ops rename.
**Consequences:** No product behavior change. Historical decision entries keep the word EDHForge where they refer to the past.
**Supersedes:** Pivot note that package rename was entirely deferred (partially completed for package/UI).

## 2026-07-20 — Catalog honesty: Inclusion rank + commanders filter (Phase 2.0.3)
**Context:** Scryfall `edhrec_rank` is Commander **deck inclusion**, not "chosen as commander". Sorting/labeling the commanders hub by "Popularity" implied a false meta ranking (e.g. staples outranking true popular commanders).
**Decision:** User-facing label **Inclusion** (tooltips explain deck inclusion). Keep sort param `popularity` for URL stability. **Commanders** browse defaults to **Name**, hides Inclusion on tiles/detail hero, and copy frames it as a legality catalog filter. Cards browse keeps Inclusion as default sort. Home demotes "Legal commanders" to secondary.
**Consequences:** Commanders hub is no longer a fake top-commanders list. Full dual-view removal remains Phase 2.0.4.
**Supersedes:** Phase 1.8 "Popularity" label as neutral-enough copy for commander browse.

## 2026-07-20 — Single card detail; commanders slug redirects (Phase 2.0.4)
**Context:** Pivot requires one oracle hub; Card \| Commander tabs duplicated D2 and implied a second "meta" product surface.
**Decision:** Canonical detail is **`/cards/{slug}`** only. Remove `EntityDetailTabs`. `/commanders/{slug}` **permanentRedirect**s to `/cards/{slug}` (preserve `?set=`). All in-app links (browse, search, sets, tiles) go to `/cards/…`. Show **Legal commander** chip when `isCommander`. Former commander-only D2 blocks (role staples in CI, GC in CI, build skeleton) stay out of detail — deferred to deck-builder insights (Phase 2.2). Sitemap lists `/cards/{slug}` only.
**Consequences:** Bookmarks to `/commanders/{slug}` still work via redirect. Browse `entity=commanders` remains a legality filter, not a parallel detail world.
**Supersedes:** Symmetric EntityDetailTabs (2026-07-10 / 2026-07-16); parallel `/commanders/{slug}` detail as product surface.

## 2026-07-20 — Show Inclusion on commanders browse tiles
**Context:** After 2.0.3 hid Inclusion on commanders browse, the hub already states that commanders is a legality filter and Inclusion is not "as commander" popularity.
**Decision:** Show **Inclusion** again on commanders browse tiles (same label/tooltip as cards). Keep name-first default sort and hub disclaimer.
**Consequences:** Users can compare inclusion while filtering legal commanders without implying a commander-choice meta ranking.
**Supersedes:** "hides Inclusion on tiles" clause of Catalog honesty (Phase 2.0.3).

## 2026-07-20 — Printings table + default_cards bulk (Phase 2.0.5)
**Context:** `set_cards` unique `(set, oracle)` collapsed multiple arts/CNs per set and lacked finishes, faces, and per-printing prices — insufficient for printing-first collection.
**Decision:** Replace `set_cards` with **`printings`**: PK = Scryfall card id; unique `(set_code, collector_number)`; fields include `finishes[]`, `faces` Json, `prices` Json, `image_uri`. Sync from Scryfall bulk **`default_cards`** (`sync:scryfall-printings`), skipping `art_series` and rows whose set is not in `mtg_sets`. Soft-join to oracle via `oracle_id`. Hero `?set=` picks lowest collector number in that set until 2.0.7 adds `?cn=`.
**Consequences:** Set detail can list multiple printings of the same oracle. Neon storage/sync cost rises vs the old search index. Version picker UI and multiface UI remain 2.0.6–2.0.7. Alias `sync:scryfall-set-cards` → printings script for old docs/workflows.
**Supersedes:** 2026-07-09 `set_cards` + per-set `unique=cards` search index as the printing model.

## 2026-07-20 — Multiface Flip UI (Phase 2.0.6)
**Context:** Printings already store `faces` Json; tiles/detail only showed the front `imageUri`.
**Decision:** Add `cards.faces` (backfilled from printings; oracle sync writes faces going forward). Shared `CardMultifaceImage`: **staggered front/back stack** (no Flip button). Hovering the back face (visible offset) raises it to the front until hover leaves. Wire into detail hero, browse/set `CardFaceTile`, similar/relatives grids.
**Consequences:** DFC/MDFC/transform cards show both faces at a glance. Version picker (set/cn/foil) remains 2.0.7.
**Supersedes:** "multiface UI remains 2.0.6" deferral in the printings decision.

## 2026-07-20 — Version picker `?set=&cn=&finish=` (Phase 2.0.7)
**Context:** Printing-first catalog needed a stable way to deep-link a concrete art/CN and finish before collection (2.1).
**Decision:** Card detail exposes **VersionPicker** (select of oracle printings + finish toggle). URL contract: `?set={code}&cn={collector}&finish={foil|etched}`; omit `finish` for nonfoil; "Catalog default" clears params. Resolve via `resolveCardPrinting` (set-only → lowest CN). Set detail and `/commanders/{slug}` redirects use `buildCardVersionHref`. Prices in hero footer prefer foil/etched when selected.
**Consequences:** Shareable printing URLs without auth. Collection items (2.1) can reuse the same set/cn/finish grain.
**Supersedes:** "`?cn=` lands in 2.0.7" deferral in the printings decision (2.0.5).

## 2026-07-20 — Drop Related parts / `card_relations`
**Context:** Scryfall `all_parts` (tokens, meld, combo pieces) on card PDP added little discovery value vs similar + relatives-by-subtype, while costing sync + storage.
**Decision:** Remove `RelatedPartsSection`, `getCardRelations`, oracle sync relation upserts, and drop `card_relations` + `CardRelationComponent` from schema.
**Consequences:** Slimmer oracle sync; PDP sections are classifications / similar / relatives-by-subtype only. Token/meld discovery is out of scope unless revisited later.
**Supersedes:** `all_parts` → `card_relations` clause of the Phase 1.8 discovery decision (2026-07-20).

## 2026-07-20 — Catalog prices EUR-first (Scryfall / Cardmarket)
**Context:** EU-first product was showing only Scryfall USD while `prices.eur` / `eur_foil` (Cardmarket via Scryfall) were already synced on cards and printings. A direct Cardmarket export sync was deferred as low ROI.
**Decision:** Default catalog currency is **EUR**. `PriceChip`, price sort, and price bands (`< €1` / `€1–5` / `> €5`) read `prices.eur*`. Display falls back to USD only when EUR is missing. No Cardmarket API/export job for now.
**Consequences:** Honest EU pricing without new sync. Bands exclude cards with no EUR. Direct Cardmarket export remains optional later for Low/Trend/AVG fields or buy links.
**Supersedes:** USD-only price chip / "Low &lt;$1" band wording from Phase 1.8.

## 2026-07-20 — Global search: single Cards section
**Context:** After unified `/cards/{slug}` detail, navbar search still split **Commanders** vs **Cards**, duplicating legendaries and implying parallel entity types.
**Decision:** `GET /api/search` returns one `cards[]` (plus `sets[]`). Legal commanders stay in that list with `isCommander` → UI label **Legal commander**. Remove the separate `commanders[]` bucket.
**Consequences:** One hit per oracle; search matches detail/browse honesty. Browse hub `entity=commanders` remains a legality filter, not a search taxonomy.
**Supersedes:** dual card/commander sections in global search (Phase 1.5.5).

## 2026-07-21 — Catalog default printing pre-selected + foil sheen
**Context:** VersionPicker showed a synthetic "Catalog default" row while the hero used oracle image/faces without set/cn, so the select did not highlight the real printing. Foil/etched finishes shared Scryfall's nonfoil art URI, so the hero looked identical.
**Decision:** `resolveCardPrinting` with no `?set=` resolves the catalog representative via `cards.id` → `printings.id` (fallback: matching `image_uri` on the oracle) and returns that printing's set/cn/finishes. VersionPicker drops the "Catalog default" option and selects that printing. Hero applies a CSS foil/etched sheen overlay when finish is foil or etched (Scryfall does not ship separate foil images).
**Consequences:** Bare `/cards/{slug}` URLs stay canonical; picker always shows a concrete set/#. Finish toggle works on the default printing. Foil uses Archidekt-style prismatic color-dodge + glare (visual cue only — same Scryfall art URI).
**Supersedes:** "Catalog default" clears params / synthetic select row in the 2026-07-20 version-picker decision (2.0.7).

## 2026-07-21 — Dynamic set types + hide-empty Role/Theme
**Context:** Sets browse used a hardcoded subset of Scryfall `set_type` values that could miss types present in `mtg_sets` or list empty ones. Role/Theme selects listed the full product enums even when no classified card used a value (zero-result clicks). Opening Role/Theme to raw Tagger tags would break the closed taxonomy Phase 3 depends on.
**Decision:** (1) Sets type select = `DISTINCT set_type` from `mtg_sets` via `listDistinctSetTypes` + `buildSetTypeFilterOptions`. (2) Browse Role/Theme options = enum ∩ values present in `card_classifications` (`listPresentClassificationFacets` + `buildRoleFilterOptions` / `buildThemeFilterOptions`); keep current selection; fall back to full enum when classifications are empty. Price bands, colors, rarity, sort stay static. Taxonomy expansion remains a separate product change to enums + maps.
**Consequences:** Sets filter tracks sync. Role/Theme stay a closed contract with fewer empty picks. No raw-otag facet soup.
**Supersedes:** hardcoded `SET_BROWSE_TYPE_OPTIONS` list for sets browse.

## 2026-07-21 — Card preview tilt is CSS 3D, not Three.js
**Context:** Wanted Archidekt-style perspective tilt on card previews (detail + browse grids). Three.js / R3F was considered for "real 3D".
**Decision:** Implement **CSS `perspective` + `rotateX/Y`** via `CardTilt` (pointer-normalized; DOM transform refs; no React re-render per move). Wire through `CardMultifaceImage` for `detail` + `grid` only (thumbnails off). Foil glare follows `--pointer-x` while tilting; idle CSS animation otherwise. Skip touch continuous tilt and `prefers-reduced-motion`. No Three.js / `card-foil` dependency.
**Consequences:** Typical TCG hover look without WebGL cost on 24–48 tile grids. Future detail-only "vetrina" (mesh thickness / holofoil shaders) could revisit R3F lazy on the hero only — out of scope here.
**Supersedes:** nothing (new surface).

## 2026-07-21 — Search results use browse/set grids
**Context:** `/search` still used compact horizontal rows while `/browse` and `/sets` used face tiles / set rows — inconsistent discovery chrome.
**Decision:** `/search` renders cards with `CardGridTile` + `CARD_FACE_GRID_CLASS` and sets with `SetBrowseRow` + `SET_BROWSE_GRID_CLASS`. Expand `GET /api/search` payloads with browse-compatible fields (faces, prices, inclusion/friction, set counts). Navbar typeahead stays compact rows.
**Consequences:** One visual language for list discovery; search API slightly heavier selects.
**Supersedes:** "`/search` keep compact horizontal rows" clause of the 2026-07-16 Wave 6–7 layout decision.

## 2026-07-21 — Full-tile hits + cursor-pointer on controls
**Context:** Set browse rows only linked the title; card tiles linked the image but not the footer. Filter toggles / selects often lacked a hand cursor.
**Decision:** Wrap set browse rows (`SetBrowseRow`) in one full-surface `Link`. Card tiles keep the link on the face image only (`CardMultifaceImage` via `CardFaceTile`) — footer is not part of the hit target. Add `cursor-pointer` to shared `Button`, `Toggle`, `SelectTrigger`/`SelectItem`, and dropdown menu items.
**Consequences:** Larger set-row hits; card tiles stay face-only for clearer separation from metrics. Nested multi-action cards (if added later) must not use full-tile links.
**Supersedes:** nothing (UX consistency pass).

## 2026-07-22 — Cursor-pointer for native buttons (site-wide)
**Context:** Shared `Button`/`Toggle`/`Select` already had hand cursors (2026-07-21), but raw `<button>` tiles in collection add, workspace search pick, versions browser, and All/Owned/Wish tabs still showed the default arrow.
**Decision:** Add a `@layer base` rule so `button:enabled` and `[role="button"]` use `cursor: pointer` site-wide; keep `cursor-pointer` on primitives (`TabsTrigger` included). Shared `CARD_PRINTING_TILE_BUTTON_CLASS` for printing/version tiles.
**Consequences:** New raw buttons inherit the hand cursor without per-call-site classes. Disabled buttons use `not-allowed`.
**Supersedes:** nothing (extends 2026-07-21 cursor-pointer pass).

## 2026-07-21 — Browse Commander is an Options filter, not a tab
**Context:** Hub `/browse` used a **Cards \| Commanders** entity tab that felt like a second catalog mode. Users want one catalog with a filter for legal commanders.
**Decision:** Remove the entity tab. Add a **Commander** Options pill last (after Game Changer / Reserved) that sets `commanders_only` → `isCommander` (+ `require_slug`). SSR/home/redirects use `/browse?commanders_only=true`; legacy `?entity=commanders` still maps. Toggling resets sort (Name when on, Inclusion default when off).
**Consequences:** One browse chrome; commander list is a filter, not a parallel hub. API keeps `entity` parsing for back-compat only.
**Supersedes:** "Cards \| Commanders toggle" / `entity=cards|commanders` hub UX in the 2026-07-20 Scryfall discovery Phase B decision.

## 2026-07-21 — Format legality select (replaces Commander legal pill)
**Context:** Multi-format decks (Phase 2.2) need catalog filtering by Scryfall legality, not only "Commander legal". The old Options pill covered only `legalities.commander`. `isCommander` (can be your commander) stays a separate Options pill.
**Decision:** Add a curated **Format** select (`src/lib/formats/scryfall-formats.ts`) on `/browse` and set detail. API param `format=<key>` filters `cards.legalities` JSONB path equals `"legal"` (whitelist keys only). Legacy `commander=legal` maps to `format=commander`. v1 does not expose restricted/banned. No schema change — reuse existing sync field. Shared format list is the seed for Deck.format later.
**Consequences:** Users can browse Modern/Pioneer/etc. legal cards. Commander Options pill remains `isCommander`. Set detail drops the Commander legal pill. JSONB path filter has no dedicated index yet (acceptable for v1; revisit near 2.2.3 if slow).
**Supersedes:** "Commander legal" Options pill as the only format-legality control (browse kit decision 2026-07-16 / hub Phase B).

## 2026-07-21 — Inclusion clarity + Color & CMC default sort
**Context:** Inclusion is Scryfall Commander deck inclusion (`edhrec_rank`). Showing it as the default sort (and on tiles) for Modern/Pioneer/etc. implies format-agnostic popularity. Arena-like browse expects color then mana value.
**Decision:** (1) Sort label **Inclusion (Commander)**; strengthen footer tooltip; hide Inclusion on browse tiles when Format is set and not Commander **unless** sort is Inclusion. (2) Default sort = Inclusion only for Format Any/Commander; otherwise **Color & CMC** (`sort=color`). Options Commander still defaults to Name. (3) Denormalize `cards.color_sort` (WUBRG mono → multicolor bitmask → colorless) at sync + migration backfill for keyset pagination (`computeColorSortKey`).
**Consequences:** Constructed format browse feels Arena-like; EDH signal stays honest. Requires `prisma migrate` for `color_sort` before color sort works in prod.
**Supersedes:** unconditional Inclusion default sort for all catalog browse (Phase B popularity-as-default).

## 2026-07-21 — Drop browse price band filter
**Context:** Browse shows Scryfall oracle representative art/prices, not the cheapest or most expensive printing among versions. Filtering by Low/Mid/High on that price misleads users about real market range.
**Decision:** Remove the **Price band** facet from `/browse` (UI, API parse, SQL band resolver). Keep per-tile **PriceChip** and optional **sort by price** (still representative EUR). Printing-aware price filters deferred until collection/deck flows need them.
**Consequences:** No more `price_band` / legacy `budget` browse params. Honest catalog facets only.
**Supersedes:** price band as a Phase B browse facet (2026-07-20 discovery decision).

## 2026-07-21 — Card text search via FTS (final: hybrid phrase + last-token prefix)
**Context:** Browse and header search were name-only. Users expect Scryfall-like matches on type line and rules text (`destroy`, `elf`, `instant`), multi-word phrase behavior (`destroy all creature` should not match via bag-of-words AND-anywhere), and progressive typing (`destroy all creatu` should still hit while typing).
**Decision:** `cards.search_document` (oracle + face texts) + DB-generated weighted `search_tsv` (name A, type_line B, document C) with GIN. Query building via `to_tsquery('english', …)`: **1 token** → `token:*`; **≥2 tokens** → tokens joined `<->` (phrase adjacency) with **prefix `:*` always on the last token**. Same helper for browse `q` and `GET /api/search`. No fuzzy/typo tolerance mid-word; Type contains stays a separate filter.
**Consequences:** `destroy` / `elf` single-word and `destroy all creatu` / `day of judgmen` progressive multi-word queries all match; phrase mode means users wanting OR/AND-anywhere must use separate single-token searches. Requires migration + optional re-sync for freshest face corpus. Closes Ops.11 for text search.
**Supersedes:** name-only `q` matching in browse/global search; Ops.11 "defer GIN until measured" for this use case.
**Iteration history:** three same-day passes (plain FTS → hybrid phrase → last-token prefix) — full step-by-step in `docs/DECISIONS-ARCHIVE.md`.

## 2026-07-21 — Card detail two-band + As card / As commander lists
**Context:** Unified `/cards/{slug}` (2.0.4) was too slim: overview mixed with lists, and commander-oriented D2 sections were deferred entirely to the deck builder. Users still want card-first focus plus the former D2 list pack when the oracle is a legal commander — without restoring parallel `/commanders/{slug}` PDPs.
**Decision:** (1) **Two bands** — overview (image / version / finish / price + meta / roles / themes) then lists. Sticky TOC lives in the lists band, not under the image. (2) When `isCommander`, **As card | As commander** ToggleGroup switches packs via `?view=commander` (default = card); preserve `set`/`cn`/`finish`. Non-commanders get card lists only (no toggle). (3) **As card** = Similar + Relatives. **As commander** = Role staples · GC in CI · Build skeleton (existing `detail-pack` helpers; Similar/Relatives stay card-view only). (4) Keep single oracle URL; `/commanders/{slug}` redirect unchanged.
**Consequences:** Commander list insights return on the detail hub without dual routes. Phase 2.2.6 still reuses the same helpers in the deck builder.
**Supersedes:** "Former commander-only D2 blocks stay out of detail — deferred to deck-builder only" clause of the 2026-07-20 Phase 2.0.4 decision (partial). Does **not** restore `EntityDetailTabs` / parallel commander detail routes.

## 2026-07-22 — Show all versions sheet on card detail
**Context:** The Version select lists set/cn labels only; users need art + price previews when an oracle has many printings, without leaving the detail URL contract.
**Decision:** Add **Show all versions** (when `printings.length > 1`) opening a bottom Sheet (~85dvh) with a browse-like `CardFaceTile` grid. Enrich `listOraclePrintings` with `prices` + `faces` (no second fetch). One tile per printing (`set`+`cn`); Finish remains on VersionPicker. Tile click uses `buildCardVersionHref` (preserve finish when supported + `view`) and closes the sheet.
**Consequences:** Visual version browsing stays on `/cards/{slug}`; select stays for quick jumps. Slightly larger SSR payload for printings JSON.
**Supersedes:** nothing (enhancement of Phase 2.0.7 VersionPicker UX).

## 2026-07-22 — Workspace overlays vs catalog PDP (deck context)
**Context:** Archidekt keeps search + card inspect as contextual layers over the deck editor so brew state is not lost. MTGPlayground is catalog-first today: almost every card open is a full navigation to `/cards/{slug}`, which would break a live deck editor.
**Decision:** Hybrid model. (1) **Catalog mode** keeps the full public PDP at `/cards/{slug}` (overview + lists, SEO/share). (2) **Workspace mode** (Phase 2.2 editor, later collection if needed) uses **contextual overlays** — search-with-Add and CardPeek — that mutate workspace state without leaving the page; peek includes "Open full page" escape hatch. (3) `VersionPicker` / `VersionsBrowser` support **`onSelectPrinting` callback mode** for embeds; default remains URL navigate on the PDP. (4) Prefer explicit React-controlled Sheets over Next intercepted routes for v1.
**Consequences:** Deck building can follow Archidekt's continuous loop without abandoning printing-first catalog hubs. Building blocks land ahead of the editor shell (`WorkspaceSearchOverlay`, `CardPeekSheet`, picker callbacks); wire when 2.2.2 lands. Do not convert browse to overlay-only.
**Supersedes:** nothing (complements 2.0.4 single PDP; scopes how 2.2 consumes it).

## 2026-07-22 — Auth.js magic link via Resend
**Context:** Phase 2.1 needs email sign-in without running an SMTP stack; OAuth alone is insufficient for users without Google/Discord.
**Decision:** Use Auth.js **Resend** provider for magic links (`AUTH_RESEND_KEY`, optional `AUTH_RESEND_FROM`). If the key is absent, the email provider is omitted at boot — Google/Discord remain usable when configured. OAuth: Google + Discord.
**Consequences:** Resend account/domain setup is ops-side; local/dev can ship with OAuth only. No Neon Auth.
**Supersedes:** nothing (implements the Phase 2 Auth.js path chosen earlier vs Neon Auth).

## 2026-07-22 — CollectionItem unique grain
**Context:** Collection must match printing-first catalog (`set` + `cn` + finish).
**Decision:** `CollectionItem` unique on `(userId, printingId, finish)` with `quantity` Int and `wantlist` Boolean. Wantlist-only rows may have `quantity = 0`; owned = `quantity > 0`. Filters on `/collection`: **All** / **Owned** (`qty > 0` ∧ `wantlist = false`) / **Wish** (`wantlist` ∧ `qty = 0`). Rows with both flags appear under **All** only. UI copy uses **Wish**; schema/API keep `wantlist`.
**Consequences:** Import and Add flows resolve to a concrete printing + finish; foil and nonfoil are separate rows. Tab filters are mutually exclusive inventory slices.
**Supersedes:** nothing (locks PROJECT.md collection grain for schema).

## 2026-07-22 — Owned / Wish as separate CollectionItem rows
**Context:** Dual-flagging one row (qty > 0 + wantlist) made Owned/Wish tabs and "Add to wish" ambiguous. Product intent: owned copies and wish copies are **two instances** of the same printing+finish.
**Decision:** Unique grain `(userId, printingId, finish, wantlist)`. Owned (`wantlist=false`) and Wish (`wantlist=true`) are separate rows, each with `quantity ≥ 1`. Tabs filter on `wantlist`. Owned tile: **Add to wish** / **On wish** create or delete the wish sibling. Wish tile: **Get** moves wish qty onto owned then deletes the wish row. **Remove** deletes only that row (`id`). Migration splits dual-flagged rows.
**Consequences:** Same printing can appear twice under All; actions are list-scoped. Import still writes owned rows only.
**Supersedes:** 2026-07-22 — CollectionItem unique grain (flag-on-same-row model).

## 2026-07-22 — Collection Owned vs Wish visual language
**Context:** Owned and wantlist rows were hard to tell apart in the collection grid (only a muted secondary button). "Wantlist / Wantlisted" was also unclear vs Owned.
**Decision:** User-facing label **Wish** (filter, chips, Add to wish / On wish / Get). Visual: **Owned** = primary/amber chip; **Wish** = info/teal chip — one chip per tile (separate rows). No status rings on grid tiles. DB column and `?filter=wantlist` unchanged.
**Consequences:** Clearer scan in All view; no migration for labels. Teal vs amber matches existing info vs primary tokens.
**Supersedes:** nothing (UI layer on the CollectionItem grain decision).

## 2026-07-22 — Collection list sort (Phase A)
**Context:** `/collection` only ordered by `updatedAt desc`. Users need inventory sorts (last added, price, name, set) before full browse facets.
**Decision:** URL `?sort=` + `?order=` with options **Last modified** (default), **Last added**, **Name**, **Set & collector #**, **CMC**, **Color & CMC** (Arena-like `color_sort` then CMC), **Price**. SQL `orderBy` for modified/added/name/set; **Price / CMC / Color & CMC** sorted in memory (Card join for cmc/`color_sort`; finish-aware EUR for price). Toolbar reuses browse Sort select + order toggle; scope tabs All/Owned/Wish preserved.
**Consequences:** No schema change. Facets (Phase B) can share the same URL/toolbar pattern.
**Supersedes:** nothing (extends 2.1 collection list).

## 2026-07-22 — Collection browse facets (Phase B)
**Context:** Inventory needed catalog-like filters after sort (Phase A). Browse is oracle-grain; collection is printing + finish.
**Decision:** Reuse browse URL keys (`q`, `color`, `type`, `cmc_min`/`cmc_max`, `rarity`, `format`) plus collection-native `finish` and `set`. Card facets resolve via `Card` → `oracleId in (…)`; **rarity** filters `printing.rarity` (not browse min-oracle rarity); **finish** filters `CollectionItem.finish`; **set** matches set code (insensitive) or set name contains. FTS `q` reuses card text search. Toolbar mirrors set-detail `BrowseFilterPanel` (debounced text fields). Defer role/theme/GC/reserved and pagination until collections grow.
**Consequences:** Same filter chrome as `/cards` and `/sets/[code]`; no schema change.
**Supersedes:** nothing (completes 2.1.7 on top of Phase A sort).

## 2026-07-22 — Collection grid shows foil sheen (hover glare)
**Context:** Detail hero already applies CSS foil/etched overlay; collection rows know `finish` but previews looked identical to nonfoil. Browse/search are oracle-level (no finish); add-collection picks finish after the grid — overlay there would mislead. Idle glare animation × many foil tiles is the expensive part.
**Decision:** Pass `finish` through `CardFaceTile` → `CardMultifaceImage` on `/collection` only. Detail keeps **animated** glare; grid/collection use **wash always + glare on hover/tilt** (`card-finish-glare-hover`). No foil overlay on browse / catalog search / add-printing grids.
**Consequences:** Foil vs nonfoil is visible in collection at a glance without N idle CSS animations. Text footer `· foil` remains for scan/a11y.
**Supersedes:** nothing (extends 2026-07-21 foil sheen to collection).

## 2026-07-22 — FTS strips apostrophes in search_tsv
**Context:** Query sanitize removes apostrophes (`Y'shtola` → `Yshtola:*`) but Postgres FTS on raw `name` splits on `'` (`y` + `shtola`), so names like Y'shtola / O'Maul never matched. Slug already stripped apostrophes.
**Decision:** Recreate generated `search_tsv` with `regexp_replace` stripping apostrophe-like characters before `to_tsvector` (name / type_line / search_document). Align `normalizeSearchName` + query sanitize to the same strip set.
**Consequences:** `Y'shtola` and `Yshtola` both hit; no Scryfall re-sync required for FTS (generated column recomputes). `search_name` updates on next sync.
**Supersedes:** nothing (extends 2026-07-21 card text search FTS).

## 2026-07-22 — Sync Wave C (bulk upsert + friction SQL + pool)
**Context:** Oracle/printings sync used per-row Prisma `upsert` (~200 round-trips per batch). Friction recompute looped `card.update`. Script Prisma clients used unbounded `pg` pools against Neon free tier. `card_oracle_taggings` had a redundant `oracle_id`-only index beside unique `(oracle_id, tag_id)`.
**Decision:** Batch `INSERT … ON CONFLICT` via `$executeRaw` (cards: conflict `oracle_id`, never overwrite `id`; printings: conflict `id`). Friction: GC baseline `UPDATE` then one `UPDATE … EXISTS` over taggings/tags with `FRICTION_TAG_SLUGS` (still exclude `weak`). `createScriptPrismaClient` uses `pg.Pool({ max: 5 })` + `disposeExternalPool`. Drop `card_oracle_taggings_oracle_id_idx`.
**Consequences:** Fewer DB round-trips on full Scryfall sync; safer Neon connection use in CLI. App `prisma` singleton unchanged.
**Supersedes:** nothing (performance layer on existing sync jobs).

## 2026-07-22 — Card detail collection CTAs + oracle inventory
**Context:** Detail only had a one-click "Add to collection" (+1 owned). Users need wish parity with the collection add sheet and a way to see which printings of this card they already own/wish.
**Decision:** Under Printing on `/cards/{slug}`: **Qty** + **Add owned** / **Add to wish** for the **active** printing+finish (finish from VersionPicker — no finish dropdown). SSR oracle inventory: rollup Owned/Wish totals + linked list of copies (`SET #cn · finish · Owned|Wish ×n`). Sign-in callback returns to the current card URL. Detail is add + inspect; qty edit / Get / Remove stay on `/collection`. No dual-flag — separate owned/wish rows.
**Consequences:** Collection mutations also `revalidatePath("/cards", "layout")` so the SSR summary refreshes. VersionsBrowser tiles stay badge-free for now.
**Supersedes:** nothing (extends Phase 2.1 collection onto the PDP).

## 2026-07-22 — Neon cost hygiene (Waves A–C)
**Context:** Neon free/compute-hour billing; storage ~236 MB is fine, but hot paths and sync write patterns burned compute (unbounded collection fetch, FTS id lists, rarity `GROUP BY` printings, commander detail O(roles) classification loops, row-by-row Scryfall upserts).
**Decision:** (A) Paginate `/collection` (48 + load-more); scope collection facets to user oracles; cap browse FTS ids at 2000 ranked; collapse detail-pack to 1+1 queries; GIN on classification roles/themes; cache present facets. (B) Denorm `cards.list_price_eur` + `min_rarity`/`min_rarity_rank`; GIN `color_identity`; printings `(oracle_id, released_at)`; lighter card `generateMetadata`. (C) Bulk sync upserts + friction SQL + script pool max 5 + drop redundant tagging index — see prior Wave C entry. Browse/collection tiles keep `faces` for multiface flip (omit-faces select reverted).
**Consequences:** Browse without `q` still counts full catalog; FTS cap only truncates very broad text matches. Sync must refresh min rarity after printings.
**Supersedes:** "GIN on color_identity deferred" note in older architecture; in-memory price-sort 5k path; per-request rarity full printings aggregate.

## 2026-07-23 — Sign-in bottom sheet as primary UX
**Context:** Dedicated `/signin` page has little content; mobile hamburger Sign in did not close the nav; LAN testing redirected OAuth to localhost when `AUTH_URL` pointed at localhost.
**Decision:** Primary sign-in is an in-page bottom sheet (`SignInSheetProvider` / `useSignInSheet`) opened from header, mobile nav, and collection CTAs. Keep `/signin` as Auth.js `pages.signIn` for middleware redirects on `/collection`. Document LAN: leave `AUTH_URL` unset + register LAN callback URIs on OAuth providers.
**Consequences:** Mobile nav closes via `onBeforeSignIn` before opening the sheet (no nested sheets). OAuth still requires correct host/provider config — the sheet does not replace that.
**Supersedes:** nothing (refines Phase 2.1 Auth UX; does not change providers).

## 2026-07-23 — Scroll: top on route change, keep on query updates
**Context:** Soft navigations sometimes landed mid-page; filter / As card|commander / version query updates jumped to top via Next's default `scroll: true`.
**Decision:** (1) Pathname change → scroll to top (`ScrollToTopOnPathnameChange`), except browser back/forward (`popstate`). (2) Same-pathname query updates → `router.push/replace(..., { scroll: false })` (collection/set filters, detail view toggle, version picker/browser).
**Consequences:** List/detail chrome stays put while filtering; entering a new route starts at the top. Browse hub filters stay client-only (no URL scroll issue).

## 2026-07-27 — Sheet unlock must not undo route scroll-to-top
**Context:** `lockBodyScroll` restores the pre-open `scrollY` on unlock. Clicking **View detail** (or other Links) inside an open sheet closed the lock after/around pathname change, so the restore reapplied the scrolled position and beat `ScrollToTopOnPathnameChange`.
**Decision:** `clearBodyScrollRestore()` zeros the pending restore (and `body.style.top` while locked). Call it from `ScrollToTopOnPathnameChange` on forward pathname changes, and from modal Links that navigate away before close.
**Consequences:** In-sheet navigations land at top. Closing a sheet without navigating still restores the prior scroll. Query-only `scroll: false` routes unchanged.

## 2026-07-27 — Deck import replaces; qty inputs respect format copy limits
**Context:** Import merged into the existing list; qty fields allowed values above format max (4-of / singleton) and only failed on submit with an error.
**Decision:** `importDeckPaste` deletes all `deck_cards` for the deck before writing the paste (no wipe if zero names resolve). Qty inputs in the editor and deck-mode modal use `maxCopiesForCard` (format maxCopies, restricted → 1, basics → 99).
**Consequences:** Re-import is a full list replace; users cannot type illegal copy counts in the primary qty controls (mutations still enforce).
**Supersedes:** merge semantics of 2.2.4 import.

## 2026-07-27 — Deck paste: About skip, blank-line sideboard, DFC resolve
**Context:** Arena exports include `About` / `Name …` metadata that were parsed as cards; plain lists often split sideboard with a blank line only; DFC oracle rows store `search_name` as `front // back`, so front-only paste lookup missed them; some rows still have apostrophes in `search_name` while lookup strips them.
**Decision:** Skip `About` (capture `Name`); blank line → sideboard only when no explicit board headers; resolve via exact/`startsWith front //` on `search_name` plus case-insensitive `name` / `name //` matches, keyed by normalized front face.
**Consequences:** Arena + MTGGoldfish-style pastes import cleanly for DFCs and apostrophe names without requiring a re-sync (re-sync still preferred to heal `search_name`).
**Supersedes:** nothing (refines 2.2.4 import).

## 2026-07-27 — ConfirmDialog instead of window.confirm
**Context:** Deck delete used the browser `window.confirm`, which ignores site chrome and dark theme.
**Decision:** Shared `ConfirmDialog` (`Sheet` `side="bottom"` + `size="sm"`) for confirmations; wire deck delete through it. No other `window.confirm` / `alert` / `prompt` call sites in app code.
**Consequences:** Destructive confirms match sign-in/import sheet language; reusable for future deletes.
**Supersedes:** nothing.

## 2026-07-27 — Rename Inclusion labels to EDH Inclusion
**Context:** “Inclusion” / “Inclusion (Commander)” was clear to us but easy to misread as format-agnostic popularity on browse.
**Decision:** All user-facing Inclusion labels use **EDH Inclusion** (sort option, tile footer, detail chips, hub copy). Sort param remains `popularity` for URL stability.
**Consequences:** One consistent label site-wide; tooltip still clarifies Scryfall Commander deck inclusion ≠ “as commander” popularity.
**Supersedes:** user-facing label wording in Catalog honesty (2026-07-20) and Inclusion clarity (2026-07-21).

## 2026-07-27 — Go to set from card detail + modal
**Context:** From a specific printing it was awkward to jump to that set’s browse page.
**Decision:** Add **Go to set** → `/sets/{setCode}` for the active printing. On the modal it sits with **View detail**; on the PDP it is a `PageShell` `headerActions` control aligned with the title block. Both stacks go under the title on mobile and to the right from `sm+`.
**Consequences:** Set deep-link is one click from any printing context; X close stays top-right in the modal.
**Supersedes:** nothing.

## 2026-07-27 — CardDetailModal deck CTAs + close-after-add on workspace pages
**Context:** Deck mode had a single Add to deck driven by a page-level board select; collection “Your copies” had no deck counterpart; success left the modal open with an “Added” line even on collection/deck pages where the list is the feedback.
**Decision:**
1. Deck mode shows **In this deck** (board + preferred version + qty + owned/missing) parallel to collection **Your copies**.
2. Deck CTAs: qty + **Add to main** + **Add to sideboard** (commander/companion still via row board move on the editor). Remove the builder “Add to” board select; workspace no longer carries `board`.
3. On collection or deck workspace pages, a successful add **closes** the card modal (and relies on `router.refresh` / page list) instead of an “Added” status line. Browse/catalog keeps the inline “Added” message.
**Consequences:** Prefer printing updates still apply when a deck row is active (`deckCardId` / In this deck selection). Payload may include `deck` snapshot when `deckId` is passed to `loadCardDetailModal`.
**Supersedes:** 2026-07-27 — Modal mode from page workspace (board field); partially supersedes collection-modal inventory success UX on `/collection`.

## 2026-07-27 — Phase 2.2 remaining scope (legality / import / insights)
**Context:** Slice 1 + card modal done; remaining roadmap items needed product locks before coding.
**Decision:**
1. **2.2.3 Legality — option B + block:** Scryfall per-card status (`legal` / `banned` / `not_legal` / `restricted`) plus deck rules (constructed main ≥60 / side ≤15 / max 4; commander-like singleton + size incl. commander; ≥1 commander; color identity). Mutations that violate card/copy/CI/commander-count **refuse**; size incompleteness surfaces as errors in the editor (does not freeze editing). Partner/Background deferred.
2. **2.2.4 Import:** Oracle-grain paste for common exports (MTGA / Arena sections + plain `N Name` lists) so lists from EDHREC / MTGGoldfish / Arena can be pasted; no preferred printing on import.
3. **2.2.6 Insights:** In-builder roles/themes counts, GC count, friction sum/avg; commander-like may reuse D2 hints. Curve/types/lands stay Phase 3 analysis.
4. **2.2.8 Guest analyze:** **Skip** for this phase (auth-to-save remains).
5. **Notes UI:** later. Remove dead `CardPeekSheet` / `loadDeckCardPeek` / unused peek helpers after modal migration.
**Consequences:** Roadmap 2.2.8 marked skipped; legality is enforcement + panel, not soft-only warnings.
**Supersedes:** nothing.

## 2026-07-23 — Responsive sheets: bottom mobile, centered desktop
**Context:** All page overlays used bottom sheets even on wide viewports; a separate Dialog package would duplicate chrome/overlay.
**Decision:** Extend `SheetContent` so `side="bottom"` stays full-bleed under `lg` and becomes a centered dialog from `lg+` (same blur overlay). Optional `size` (`sm` / `md` / `lg`) sets desktop `max-w-*` only. Call sites keep `side="bottom"`; sign-in/import `sm`, peek `md`, content sheets default `lg`.
**Consequences:** One primitive for mobile + desktop overlays; left/right/top sides unchanged. No shadcn Dialog package.
**Supersedes:** nothing (refines sheet chrome; does not change which surfaces open).

## 2026-07-23 — No `/signin` page navigation; sheet-only gate
**Context:** Header **Collection** hit Auth.js middleware and redirected to the full `/signin` page, while other CTAs already opened `SignInSheet`.
**Decision:** Remove collection middleware protection. Unsigned **Collection** nav uses `RequireAuthLink` (opens sheet with `callbackUrl=/collection`). Unsigned `/collection` renders `CollectionSignInGate`. `/signin` remains Auth.js `pages.signIn` but only bridges to the sheet then `router.replace(callbackUrl)`.
**Consequences:** Users never stay on a dedicated sign-in page for normal flows; OAuth error redirects still land on `/signin` briefly then open the sheet.
**Supersedes:** "Keep `/signin` for middleware redirects on `/collection`" in the 2026-07-23 Sign-in bottom sheet entry.

## 2026-07-23 — List filter recovery chrome (final: sticky slot, modal drawer, translate3d)
**Context:** Long filtered lists (`/browse`, `/sets`, set detail, `/collection`) bury the always-visible filter panel; users need scroll recovery without collapsing filters by default.
**Decision:** `ListFilterAccess` portals a Filters tongue + drawer into `#site-header-chrome` (the sticky header's slot), shown once the entire toolbar panel has scrolled above the nav (`toolbar.bottom <= --site-header-height`, gated on first measurement — avoids a top-of-page flash and below-fold false negatives on tall mobile panels). Header is flat (`bg-background` + `border-border`, no blur) so the attached-tab illusion reads clearly; tongue is centered, keeps the header border visible when closed, and tucks into the drawer's bottom seam when open. Open state is modal: body scroll lock + full-viewport scrim (`z-35`, under the header `z-40`) that captures outside taps to close only (no click-through to cards); dismiss via scrim, tongue, or Escape. Drawer + tongue animate as one bottom-anchored block via `translate3d` (not `height` — unreliable on iOS Safari), height clipped instantly to the measured panel size while mounted; the open slide only starts once `panelHeight` is actually measured (`slideMotionOn` setup-frame trick avoids a 0-offset snap). All motion respects `prefers-reduced-motion`.
**Consequences:** Extends (does not reverse) always-visible filters — the sticky tab is scroll recovery, not a default collapse. Filter URL updates keep `scroll: false`. Chrome stays inside `max-w-7xl` gutters. Scoped to the four list routes.
**Supersedes:** nothing (partially extends 2026-07-16 always-visible filters with recovery chrome).
**Iteration history:** seven same-day passes (fixed-position → sticky slot → scroll-threshold fix → flat header → tongue placement → modal dismiss → height-clip → translate3d) — full step-by-step in `docs/DECISIONS-ARCHIVE.md`.

---

## 2026-07-24 — CI workflow + lint baseline cleanup

**Context:** No CI ran `lint`/`test`/`build` on push or PR — only the (disabled) Scryfall sync workflow existed. `npm run lint` also had 15 real errors (not style warnings) across 9 files: `react-hooks/refs` (writing `ref.current` during render) and `react-hooks/set-state-in-effect` (unconditional `setState` as the first statement of an effect) — patterns the newer React-Compiler-oriented `eslint-plugin-react-hooks` rules flag because they break render-purity/memoization assumptions. `npm audit` also flagged 4 high-severity advisories via `next`'s bundled `postcss`/`sharp` (the latter used by Next's Image Optimization API, which this app relies on for Scryfall images) — no stable `next` release fixes them yet.

**Decision:**
1. **CI:** `.github/workflows/ci.yml` — `lint` → `test` → `build` on push/PR to `main` + manual dispatch. `next build` needs no real DB (all routes are `force-dynamic`, no `generateStaticParams` — verified empirically) so the build step uses a placeholder `DATABASE_URL`/`DIRECT_URL`, no GitHub secret required.
2. **Dependency patch:** `next` + `eslint-config-next` → `16.2.11` (exact pin, matching existing style). Added `overrides` for `postcss` (`^8.5.22`) and `sharp` (`^0.35.3`) in `package.json` to force patched versions inside `next`'s own dependency tree, since `next` itself doesn't declare a fixed range yet. Two remaining moderate/high advisories (`fast-uri` / `@hono/node-server`, both inside Prisma's local dev-tooling — Prisma Studio, not the deployed app) left as-is: no clean fix exists in the declared `prisma` range today, and `npm audit fix` only swaps one equivalent CVE for another.
3. **Lint fixes:** refactored all 9 flagged components/hooks to the React-blessed patterns — "adjust state during render" (a tracked previous-key/value in state, compared and reset synchronously in the render body) for prop-driven resets, and ref writes moved into a small `useEffect` keyed on the tracked value for "always latest" ref patterns. `list-filter-access.tsx` (the sticky filter drawer, most-iterated component in this log) kept its exact rAF/timeout orchestration, only wrapping the previously-synchronous `setState` calls in an outer `requestAnimationFrame` (with proper `cancelAnimationFrame` cleanup) so no direct/unconditional `setState` remains in an effect body — verified manually in-browser (open/close, scrim dismiss, Escape, scroll-based reveal) with no console errors or visible timing regressions.

**Consequences:** `npm run lint` and `npm test` are green; `npm audit` down to 2 (dev-tooling-only, deferred). First CI run lands green, not red. No schema/behavior changes to any user-facing flow — this is a hygiene pass only.
**Supersedes:** nothing (closes a gap the pivot-era decisions didn't cover).

## 2026-07-26 — Deck schema + `/decks` workspace (Phase 2.2 slice 1)
**Context:** Phase 2.2 needs private multi-format decks with oracle-grain lists, preferred printings, and owned/missing vs collection. Roadmap draft mentioned `/my/decks`; middleware already reserved `/decks`.
**Decision:**
1. **Routes:** `/decks`, `/decks/[id]` (no `/my/` prefix). Create is a sheet on `/decks` — see 2026-07-30 Create deck via sheet.
2. **Schema:** `decks` (`user_id`, `name`, `format` as Scryfall browse key string, optional `notes`) + `deck_cards` unique `(deck_id, oracle_id, board)` with `board` ∈ `main` \| `side` \| `commander` \| `companion`, `quantity` ≥ 1, optional `preferred_printing_id` → `printings` (`ON DELETE SET NULL`). Soft-join cards via `oracle_id` (same pattern as printings).
3. **Limits:** 50 private decks / user; 250 card copies / deck (hard).
4. **Editor:** Wire existing `WorkspaceSearchOverlay` + `CardPeekSheet` + `onSelectPrinting` for preferred printing; owned/missing from collection oracle aggregate (wish excluded).
5. **Auth UX:** Same as Collection — no middleware page redirect; `RequireAuthLink` + `DecksSignInGate` (sheet-only).
6. **Out of slice:** legality engine, Arena paste, builder insights, guest analyze, `DeckPublication`.
**Consequences:** Nav adds **Decks** (auth sheet when signed out). Commander/Partner are board slots, not Deck columns — legality (2.2.3) will enforce format rules. Requires migration `20260726160000_decks_and_deck_cards`.
**Supersedes:** Roadmap path `/my/decks` for private CRUD (analysis route in Phase 3 may still use nested paths under `/decks`).

## 2026-07-26 — Environments: Git / Vercel / Neon / Google
**Context:** App is hosted on Vercel with separate Neon branches and Google OAuth clients. Local `prisma migrate dev` against Neon `dev` failed after a rolled-back collection migration left an orphan `_prisma_migrations` row, which Prisma treated as “modified after applied” and demanded a reset.
**Decision:**
1. **Map:** Local → Neon `dev` + Google local; Vercel Preview (git branch `dev`) = online staging → Neon `Staging` + Google staging; Vercel Production (git `main`) → Neon `production` + Google prod.
2. **Migrations on Neon:** prefer `prisma migrate deploy` (`npm run db:migrate:deploy`). Reserve `migrate dev` for disposable DBs.
3. **Checksum / orphan recovery:** if `migrate` claims a migration was modified, inspect `_prisma_migrations` for `finished_at IS NULL` (rolled-back attempt) before resetting; delete the orphan, then deploy.
**Consequences:** Documented in `docs/ARCHITECTURE.md` + README / `.env.example`. Staging and production never use `migrate reset`. Local Neon `dev` is the safe place for schema experiments.
**Supersedes:** nothing (ops documentation gap).

## 2026-07-27 — Unified card detail modal (in-app primary)
**Context:** In-app card opens were split: catalog tiles navigated to `/cards/{slug}` PDP; deck used `CardPeekSheet`; collection add had its own search→printing sheet. Users want one overlay for inspect + last step of add-to-collection / add-to-deck, without losing SEO/share on the full detail page.
**Decision:**
1. **`CardDetailModalProvider`** (root) + `useCardDetailModal().open(...)` — primary click on cards (browse, search, sets, collection, collection-add, deck) opens one Sheet (`size="xl"`).
2. **Modal body:** hero (image, status, market — no Roles/Themes) + **version tile grid** + inventory/CTAs aligned with PDP **CardCollectionPanel** (This printing / Card total, Qty + Add owned / Add wish, **Your copies**) + **View detail** → PDP. Finish is an explicit **ToggleGroup** when the printing allows multiple finishes (not nested in Add menus). `deck` mode: owned snapshot + qty + **Add to main** / **Add to sideboard** + **In this deck** list (preferred printing on version select when a deck row is active).
3. **PDP kept as today** at `/cards/{slug}` (VersionPicker, Show all versions, collection panel, As card / As commander lists). Middle-click / cmd-click / new tab still hit the PDP href.
4. Collection-add search only picks a card then opens the modal (printing step removed). Deck editor uses the same modal (`mode: "deck"`); `CardPeekSheet` path retired from the editor.
**Consequences:** In-app discovery is modal-first; public hub + lists stay on the PDP. Supersedes “do not convert browse to overlay-only” from 2026-07-22 for primary clicks (href escape hatch remains).
**Supersedes:** 2026-07-22 Workspace overlays vs catalog PDP — clause “Do not convert browse to overlay-only” (partial); peek-as-deck-only building block.

## 2026-07-27 — Modal collection UI matches PDP panel
**Context:** The unified modal’s add/owned block was thinner than the detail page (finish buried in Add dropdowns; no “Your copies” list).
**Decision:** Mirror `CardCollectionPanel` in `CardDetailModal`: summary line, qty + Add owned / Add to wish, Your copies (select printing+finish), Collection link. Expose finish via ToggleGroup when `finishes.length > 1`. After add, refetch collection via `loadCardDetailModal` so the overlay updates without relying on provider payload alone.
**Consequences:** Same mental model between modal and PDP for inventory; finish choice is visible before adding.

## 2026-07-27 — Detail controls width + shared finish selected style
**Context:** PDP overview capped the whole meta column at `max-w-2xl`, which also squeezed Status/Roles/Themes/Market. Finish toggles on PDP vs modal looked different.
**Decision:** Drop column `max-w`; constrain **Version** (`max-w-md`) and **Finish** (`w-fit`) only. Shared finish ToggleGroup: `outline` + `sm` + primary when pressed (`PRINTING_FINISH_TOGGLE_ITEM_CLASS`) on PDP and modal. Modal omits Roles/Themes (PDP keeps them).
**Consequences:** Wide viewports keep badges/market readable; selects/toggles stay compact and visually consistent.

## 2026-07-27 — Detail modal mode from page workspace
**Context:** Opening the card modal from header search while on a deck page still showed collection CTAs because callers hardcoded `mode: "collection"`. Deck add search also used an explicit Add button instead of the collection tile-click list.
**Decision:** `CardDetailModalProvider.setDeckWorkspace` — deck editor registers `{ deckId, onDeckMutated }` for the page lifetime; while set, every `openCardDetail` uses deck mode (page wins over entry point). Collection page registers `setCollectionWorkspace` so successful adds close the modal. Collection + deck add search share `WorkspaceSearchPanel` with whole-tile pick (no per-hit Add button).
**Consequences:** Header search on `/decks/[id]` opens Add to main/sideboard CTAs. Board choice lives in the modal, not a page select. Leaving the editor clears the workspace.
**Supersedes:** nothing (refined by 2026-07-27 CardDetailModal deck CTAs + close-after-add).

## 2026-07-28 — Card detail modal: lazy Versions + Roles/Themes
**Context:** Every modal open ran `listOraclePrintings` (full oracle set), which is heavy for staples with dozens of printings. Modal also omitted Roles/Themes that the PDP shows.
**Decision:**
1. **Initial payload** resolves a **single** active printing (`resolveOraclePrintingOption`) + cheap `printingCount`; `printingsLoaded` is true only when count ≤ 1.
2. **Hero preview** stays in the modal overview (full-width mobile, `max-w-[16rem]` from `sm`) with set#·finish + price under the art. **Versions** is a **Collapsible** starting closed with only the version tile grid; opening loads the full list once via `loadCardDetailModalPrintings`. Selecting from Your copies / In this deck may also trigger that load if the target printing is not seeded.
3. **Status | Roles | Themes** via `ClassificationBadges` (same pattern/position as PDP overview). Finish + CTAs stay in the overview column beside the hero.
**Consequences:** Modal open stays light; version browsing is opt-in. Active art remains visible without expanding Versions.
**Supersedes:** 2026-07-27 Unified card detail modal — “no Roles/Themes”; 2026-07-27 Detail controls — “Modal omits Roles/Themes”.
## 2026-07-28 — Card detail hero breakpoint: PDP matches modal (`sm`)
**Context:** PDP overview stacked image over meta until `lg`, while `CardDetailModal` switched to image | meta at `sm` — tablet widths looked inconsistent.
**Decision:** Share `DETAIL_HERO_GRID_CLASS` + `CARD_DETAIL_IMAGE_COLUMN_CLASS` between PDP and modal: full-width stacked hero under `sm`; 16rem image column beside meta from `sm`. Lists TOC (`DetailSectionJump` / `DetailSectionNav`) stays on the `lg` split.
**Consequences:** Same overview responsive behavior on page and overlay; image column is slightly narrower on large PDP than the old 300px sidebar.
**Supersedes:** older “detail image max 300px / two-column from `lg`” overview notes in `docs/UI.md`.

## 2026-07-28 — PDP hero image column stays 300px
**Context:** Aligning PDP/modal to the `sm` stack split accidentally narrowed the PDP image to the modal’s 16rem column.
**Decision:** Keep shared `sm` breakpoint; PDP uses `DETAIL_HERO_GRID_CLASS` / `CARD_DETAIL_IMAGE_COLUMN_CLASS` at **300px**; modal keeps `CARD_DETAIL_MODAL_*` at **16rem**.
**Consequences:** Tablet+ PDP art matches the pre-alignment size; modal stays compact in the sheet.
**Supersedes:** 2026-07-28 Card detail hero breakpoint — shared 16rem column clause only.

## 2026-07-28 — Modal Show all versions = nested VersionsBrowser
**Context:** CardDetailModal used an inline Versions Collapsible; PDP already had Show all versions as a nested sheet.
**Decision:** Reuse **`VersionsBrowser`** in the modal (button → nested sheet). Lazy-load via `printingCount` + `loadCardDetailModalPrintings` on open; `onSelectPrinting` updates the modal preview and closes the nested sheet (no PDP navigation). Body scroll lock remains reference-counted for nested sheets.
**Consequences:** Same version-browse UX on page and overlay; Collapsible versions UI removed from the modal.
**Supersedes:** 2026-07-28 Card detail modal lazy Versions — Collapsible clause only.

## 2026-07-28 — Status|Roles|Themes stack until `lg` (PDP + modal)
**Context:** Modal already stacked classification until `lg` (bottom-sheet chrome); PDP still went multi-column from `sm`, so tablet widths disagreed.
**Decision:** `ClassificationBadges` default `rowFrom="lg"` — single column under `lg`, shared row from `lg` on both PDP and modal.
**Consequences:** Same Status / Roles / Themes stacking on page and overlay below the sheet dialog breakpoint.
**Supersedes:** prior “one row from `sm`” classification notes for the PDP overview.

## 2026-07-28 — PDP lazy printings + VersionsBrowser skeleton
**Context:** Modal already deferred `listOraclePrintings` until Show all versions; PDP still SSR’d the full list. Modal loading copy was a plain text line.
**Decision:** PDP overview seeds one active printing + `printingCount` (`resolveOraclePrintingOption`); `CardDetailPrintingControls` loads via shared `loadOraclePrintings` when Show all versions opens or Version select is first used. `VersionsBrowser` shows `CardGridSkeleton` while the list fetches (modal + PDP).
**Consequences:** Faster card page TTFB for multi-printing oracles; same lazy browse UX on page and overlay.
**Supersedes:** SSR `listOraclePrintings` on `/cards/[slug]` overview.

## 2026-07-29 — Skeleton footprint: no sheet/page jump
**Context:** After lazy versions + modal/PDP layout changes, skeletons drifted from real chrome and `h-fit` sheets jumped short→tall.
**Decision:** Align `CardDetailModalSkeleton` / PDP hero skeletons to live layout (Finish slot, no fake header close during load, Classification stack under `lg`). Reserve height with `SHEET_CARD_DETAIL_LOADING_MIN_H_CLASS` and `SHEET_CARD_GRID_BODY_MIN_H_CLASS` (VersionsBrowser + workspace search). Drop always-on As card/As commander from lists skeleton; remove unused `BreadcrumbSkeleton` / `PrintingListSkeleton`.
**Consequences:** Loading states hold footprint closer to loaded UI; fewer layout shifts on modal open and Show all versions.

## 2026-07-29 — PDP lists stream; collection Suspense fallbacks
**Context:** Full-page PDP wait blocked on similar/relatives/commander packs; collection used empty `h-24`/`h-40` Suspense placeholders.
**Decision:** (1) `/cards/[slug]` awaits only hero-critical data (card, active printing, classification, auth/collection); lists load in `CardDetailListsDeferred` behind `Suspense` + `DetailListsBandSkeleton`. (2) `/collection` wraps content like sets — page `Suspense` fallback uses `BrowseToolbarSkeleton` + `PageListMetaSkeleton` + `CardGridSkeleton`. Document skeleton levels A (reserve) vs B (tolerate) in `docs/UI.md`.
**Consequences:** Card PDP hero paints sooner; collection soft-nav shows real chrome instead of blank boxes.

## 2026-07-29 — Soft reveal for level-B bands
**Context:** Variable bands still hard-cut in after Suspense / classification paint.
**Decision:** Level-B reveals use `CONTENT_REVEAL_CLASS` (`animate-in fade-in` + `motion-reduce:animate-none`) on streamed lists and classification badges.
**Consequences:** Softer list/badge appearance without inventing height for unpredictable payloads.

## 2026-07-29 — Revert modal stale-while-revalidate
**Context:** Keeping the previous card dimmed while loading felt worse than the reserved skeleton; `CardDetailModalSkeleton` + `SHEET_CARD_DETAIL_LOADING_MIN_H_CLASS` already avoid sheet height shift.
**Decision:** `openCardDetail` clears `payload` and shows the skeleton on every open again. No opacity dim on stale content.
**Consequences:** Clear loading state per card open; footprint still stable via the loading min-height.
**Supersedes:** Modal portion of “Soft reveal + modal stale-while-revalidate” (same day; that entry was split — soft reveal kept, SWR dropped).

## 2026-07-29 — Remove Friction score
**Context:** Friction (0–3 from GC + stax-family otags) was inconsistent and rarely surfaced enough to matter in browse footers, detail Status, or deck insights.
**Decision:** Drop product + storage entirely: remove `cards.friction_score` (migration `20260729190000_drop_friction_score`), delete `src/lib/classification/friction.ts`, stop writing friction in Scryfall sync / classifications job, strip UI props and deck insight sum/avg.
**Consequences:** Status / tile footers show EDH Inclusion + GC + Reserved only; builder insights keep GC + roles/themes + skeleton. Game Changer flag remains the clear “salt” signal.
**Supersedes:** Friction portions of Phase 1.8 discovery, Wave C friction SQL, and 2.2.6 friction insights.

## 2026-07-29 — Align Printing chrome (PDP + modal)
**Context:** Card detail modal lacked Version select; PDP/modal Printing layouts drifted from Status|Roles|Themes columns.
**Decision:** Shared `VersionPicker`: Version + Show all in a flex-wrap pair (`h-8` button matches SelectTrigger). When Finish exists, use the same 3-col track as Status|Roles|Themes (`gap-4` / `lg:gap-6`): stack under `lg`; from `lg` Version spans 2 / Finish 1. Modal uses `onSelectPrinting` (no navigation).
**Consequences:** One Printing pattern site-wide; Version gets the wider share from the sheet/dialog breakpoint upward.

## 2026-07-29 — Classification badges fill leftover columns
**Context:** Status|Roles|Themes switched to a 2-col grid when one section was missing, or could leave empty space vs the Printing 3-col track.
**Decision:** Always use the fixed 3-col track from `lg` (same as Printing). When a section is missing, the last visible block spans the leftover columns (2 items → 1+2; 1 item → full width). Never leave an empty column.
**Consequences:** Status|Roles|Themes and Printing share the same column track; sparse classification rows stay filled.

## 2026-07-29 — Lean level-B loading (no fake grids on-page)
**Context:** Dense `CardGridSkeleton` / lists-band chrome made soft nav and PDP list streaming feel like waiting even when the page/hero was already usable.
**Decision:** (1) Keep level A only where geometry jumps (sheets, card aspect, modal/versions, toolbar height). (2) Level B uses lean `ListPagePendingSlot` / `DetailListsBandSkeleton` (muted min-h slot) or soft reveal — not fake TOC/card tiles. (3) PDP `loading.tsx` = hero only; lists stream after. (4) Collection drops page-level Suspense (decks-style keep-mounted). (5) Browse clients keep previous items dimmed while refetching.
**Consequences:** Less skeleton theatre; first-paint chrome stays; in-page refetches don’t wipe results.
**Supersedes:** Collection Suspense + full `CardGridSkeleton` fallback from “PDP lists stream; collection Suspense fallbacks” (same day); heavy `DetailListsBandSkeleton` grid from that entry.

## 2026-07-30 — Block-fino-ai-dati as site loading default
**Context:** Lean slots and route Suspense still felt like waiting; decks (~100 cards) already block until data with no page skeleton, so browse/collection/set/PDP should match.
**Decision:** (1) Default PageShell routes = block until data — no `loading.tsx`, no page Suspense fallback UI. (2) Skeletons only for on-demand overlays: card detail modal, VersionsBrowser, workspace/global search. (3) PDP awaits hero + lists together (no lists Suspense). (4) Client list refetches keep previous results with no opacity dim / pending slot. (5) Filtered lists share `ListFilterAccess` + `PageListMeta` chrome (URL vs client filter state unchanged).
**Consequences:** Soft-nav feels like decks site-wide; skeleton theatre limited to optional sheets.
**Supersedes:** “Lean level-B loading” and route/`loading.tsx` portions of “PDP lists stream; collection Suspense fallbacks” (2026-07-29).

## 2026-07-30 — Overlay defer-open + PDP hero-first stream
**Context:** Modal/versions skeletons still felt like waiting; full PDP block (hero+lists) felt slower than other pages.
**Decision:** (1) Card detail modal and Versions browser stay closed until data is ready — no `CardDetailModalSkeleton` / in-sheet versions skeleton. (2) PDP awaits hero only; lists stream again via `CardDetailListsDeferred` with `fallback={null}`. (3) Workspace/global search keep hit skeletons inside already-open UI.
**Consequences:** Overlays appear complete; card PDP first paint matches other pages’ snappiness while lists fill in after.
**Supersedes:** Overlay-skeleton and “PDP awaits hero + lists together” portions of “Block-fino-ai-dati as site loading default” (same day).

## 2026-07-30 — Detail image preload + hero priority
**Context:** Detail page/modal still felt slow; Scryfall art only started after the full data payload, and heroes used default lazy `next/image`.
**Decision:** (1) Pass tile `imageUri`/`faces` into `openCardDetail` and `preloadImage` the front face while the modal payload loads. (2) PDP/modal heroes use `priority` + `fetchPriority="high"`; multiface back stays mounted with lazy fetch (hover only raises it — deferred mount was reverted; gray strip until hover felt broken). (3) PDP runs collection summary in parallel with printing/classification (not after). (4) Modal payload loads collection ∥ deck snapshot.
**Consequences:** Art can hit cache before the sheet opens; LCP hero is eager; signed-in detail waits less on serial user queries.

## 2026-07-30 — Modal opens on catalog; user data after
**Context:** Even with collection ∥ deck, signed-in `loadCardDetailModal` still waited on `auth()` + user queries before the sheet could open.
**Decision:** (1) `loadCardDetailModal` returns catalog hero only (no auth / collection / deck). (2) After open, `loadCardDetailModalUserData` fills collection + optional deck snapshots; summary / “Your copies” / “In this deck” pulse meanwhile; Add CTAs stay usable. (3) Post-add refresh uses the user-data action only.
**Consequences:** Modal time-to-open matches guest path for signed-in users; inventory chrome streams in after hero.
**Supersedes:** Clause (4) of “Detail image preload + hero priority” (same day).

## 2026-07-30 — Restore search_tsv after bad friction migration
**Context:** `20260729163755_drop_friction_score_dev` was Prisma drift SQL that dropped `cards.search_tsv` and several GIN indexes (not friction). Browse `q` and `/api/search` then 500’d with `column "search_tsv" does not exist`.
**Decision:** Add `20260730120000_restore_search_tsv` to recreate the generated FTS column (apostrophe-strip definition) + GIN indexes. Keep the bad migration as historical applied SQL; the intentional friction drop remains `20260729190000_drop_friction_score`.
**Consequences:** Text search works again after `db:migrate:deploy` on affected DBs.

## 2026-07-30 — Soft-nav top progress bar
**Context:** Block-fino-ai-dati keeps the previous page visible until RSC arrives, so slow soft-nav can feel frozen (sites like EDHREC use a thin top bar).
**Decision:** Custom `NavigationProgress` (no `nextjs-toploader` / nprogress): start on same-origin Link/`<a>` clicks in **capture** phase (Next soft-nav `preventDefault` is not a skip signal), fake progress to ~90%, complete when URL leaves the click-origin key; **100ms anti-flash** before show (site-wide — fast/prefetched navs stay silent); brand `bg-primary`; no spinner. Overlay-only links opt out with `data-nav-progress="skip"`. Do not wrap all `useRouter` in v1 — `startNavigationProgress` / `doneNavigationProgress` remain for optional call sites.
**Consequences:** Page transitions get clear loading affordance without restoring route skeletons; filter `router.replace` stays silent unless wired later; tile/modal opens do not leave the bar stuck.

## 2026-07-30 — Deck editor grid + type sections
**Context:** List rows felt dense and unlike browse/collection; builders expect Goldfish-style Main split by type and CMC order.
**Decision:** (1) Deck editor cards are **grid-only** (`CARD_FACE_GRID_CLASS` + `CardFaceTile`); no list/grid toggle in v1. (2) Main + Sideboard group by primary type (`card-type-groups.ts`: Creature first so Artifact Creature → Creature; DFC uses front face); sort CMC → name within groups. Commander/Companion stay flat. (3) `getDeckDetail` sorts board → type → CMC → name for stable SSR. (4) Surge/special foil via `promo_types` deferred (needs migration + printings re-sync).
**Consequences:** Editor matches site tile language; type sections need no schema change (`typeLine` + `cmc` already on `DeckCardView`).

## 2026-07-30 — Outline toggle active = input fill
**Context:** Finish / As card|commander / filter pills used full `bg-primary` when selected, competing with primary action buttons.
**Decision:** Outline `Toggle` / `ToggleGroupItem` pressed state uses `bg-input` (same token as the idle border) + foreground text. Reserve solid primary for submit/important actions. Mana/rarity symbol filters keep ring affordance.
**Consequences:** Selection chrome is quieter site-wide wherever outline toggles are used.

## 2026-07-30 — Action full vs label soft (primary + info)
**Context:** Need a clear rule for brand orange and wish teal across buttons, chips, and selection toggles.
**Decision:** Shared tokens in `src/lib/ui/selection-chrome.ts`: **Action (primary)** = full border + full fill (`Button` default); **Label** = full border + `bg-*/15` (`LABEL_*`, status chips, outline toggle pressed, filter pills); **info/wish buttons** = label chrome (not solid). Nav active tabs stay solid primary for wayfinding.
**Consequences:** Add owned / Get are solid primary; Add to wish uses soft info label chrome; Owned·Wish chips and Finish/As card|filters use soft fills. Supersedes “Outline toggle active = input fill” (same day).
**Supersedes:** 2026-07-30 — Outline toggle active = input fill.

## 2026-07-30 — Special foil promo_types deferred
**Context:** Surge Foil etc. are Scryfall `promo_types` on distinct printings with `finishes: ["foil"]`; we only store `finishes` and UI maps nonfoil|foil|etched.
**Decision:** Postpone persisting `promo_types` and labeled special foils until a dedicated migration + `default_cards` re-sync.
**Consequences:** Special foils remain labeled “Foil” until that work lands.

## 2026-07-30 — Wish/info teal darkened for solid CTAs
**Context:** `--info` at L≈0.75 with light foreground made `Button variant="info"` (Add to wish) look washed out vs primary actions.
**Decision:** Darken `--palette-info` to L≈0.58 and set `--info-foreground` to a light `--palette-info-ink` (on-fill text). Label wish chips use `text-info` on translucent fill.
**Consequences:** Wish solid buttons read as full teal CTAs; soft chips/alerts stay the same token family.

## 2026-07-30 — Wish buttons use label opacity (teal reverted)
**Context:** Darkened solid teal CTAs were unconvincing; original light `--info` is better for chips/notices.
**Decision:** Restore `--palette-info` to L≈0.75 / soft-fg. `Button variant="info"` and `ACTION_INFO` use label chrome (`border-info bg-info/15`), not full fill. Primary actions stay solid.
**Consequences:** Add to wish / wish CTAs match Owned·Wish chip language; only brand primary stays full-style action.
**Supersedes:** 2026-07-30 — Wish/info teal darkened for solid CTAs.

## 2026-07-30 — Deck size shown as main(+side)
**Context:** Listing and builder showed a single total (main+sideboard), which hides the split builders care about.
**Decision:** Always display `formatDeckSizeLabel` → `N M · S S` where N = main+commander+companion and S = sideboard. Shared helpers in `boards.ts`.
**Consequences:** `/decks` list and deck editor meta use the same label; never a combined “75 cards” total.
**Supersedes:** (format only) earlier same-day `N(+S)` wording in this entry’s first draft.

## 2026-07-30 — Deck editor sticky Add cards
**Context:** Collection keeps Add cards reachable via sticky header chrome after the toolbar scrolls away; the deck editor buried Add in the meta panel.
**Decision:** Wrap the deck meta panel in `ListFilterAccess` with `showFilterTongue={false}` and compact `WorkspaceSearchOverlay` as `stickyActions` (portal under nav, no Filters tongue).
**Consequences:** Scrolling the card grid keeps Add cards sticky like collection; Import stays in the meta panel only.

## 2026-07-30 — Create deck via sheet on /decks
**Context:** Inline create form under the list + dedicated `/decks/new` page duplicated the same form.
**Decision:** Single primary **New deck** on `/decks` opens a `size="sm"` sheet (`CreateDeckDialog`). Remove the list-page form. `/decks/new` redirects to `/decks`.
**Consequences:** One create entry point; bookmarks to `/decks/new` still land on the list.

## 2026-07-30 — Deck editor Grid + Goldfish list view
**Context:** Grid tiles match the rest of the site but long decks need a dense “whole deck at a glance” layout (MTGGoldfish-style).
**Decision:** Add a second **List** presentation beside Grid. Rows: qty · name · mana cost · light Owned/Missing chip · price · board · Remove (no collect CTA in list). Hover name → floating art preview (fine pointer); click name → card detail modal. Multi-column CSS (`1 / sm:2 / xl:3`); **Main** type sections `break-inside-avoid`; **Sideboard flat** (no type subcats) with title+rows in one `break-inside-avoid` so the Sideboard heading never orphans at a column end. Default **List**; persist in `localStorage` (`mtgplayground.deckEditorView`). Expose `manaCost` on `DeckCardView`; render via `ManaCost` / `parseManaCost`.
**Consequences:** Deck editor opens in list for scan-first completeness; browse/collection remain grid-only. Collection top-ups stay on grid tiles / detail modal.
**Supersedes:** (default + sideboard layout) earlier same-day drafts of this entry.

## 2026-07-30 — Sign out leaves account workspaces
**Context:** Signing out on `/collection` or `/decks/*` refreshed into `*SignInGate`, which auto-opened the sign-in sheet on an empty workspace.
**Decision:** `UserMenu` Sign out calls `signOut({ callbackUrl: "/" })` when `isAuthRequiredHref(pathname)` (collection/decks); other routes keep the current URL.
**Consequences:** Logout from user flows returns home; unauthorized visit to those URLs still shows the gate + sheet as before.

## 2026-07-30 — Unified Collection | Decks manage + lazy modal lists
**Context:** Detail modal CTAs flipped between collection-only and deck-only by page workspace; PDP had collection only. Building decks from browse/search needed Add to deck everywhere, and modal related lists were missing (or would be heavy if always fetched).
**Decision:**
1. Always show **Collection** and **Decks** side by side (`CardManagePanels`) in the card detail modal and on the PDP (`CardDetailManageSection`).
2. Decks column: deck `<Select>` + qty + Add to main/sideboard + in-deck lines. Default deck = workspace deck on an editor page, else `localStorage` `mtgplayground.lastDeckId` (written on deck page visit and successful adds), else most recently updated deck. Select remains visible on the current deck page.
3. Modal **Related cards** collapse loads similar / relatives / commander packs only when opened (`loadCardDetailLists`); tile clicks replace the open modal via `openCardDetail`.
**Consequences:** One manage UX across modal + PDP; deck adds available from any card open; modal open stays light until lists are expanded.
**Supersedes:** Modal mode that showed either collection CTAs or deck CTAs (not both).

## 2026-07-30 — Modal lists match PDP As card / As commander
**Context:** Modal Related cards dumped all sections without the PDP view split or TOC; with near-parity content, “View detail” was misleading.
**Decision:** Reuse `CardDetailLists` in the modal (`variant="sheet"`): As card / As commander toggles in-place, sticky jump + lateral TOC (sheet sticky top), denser sheet grid classes that still +1 column when TOC is absent. Rename header CTA to **Go to page**. Scroll-spy uses the nearest scrollport so TOC active state works inside the sheet.
**Consequences:** Modal lists feel like a compressed PDP; full page remains for SEO/share and deep links.

## 2026-07-30 — Phase 2.3 precons (MTGJSON constructed)
**Context:** Need official precon browse/fork/owned gap without scraping retail sites; MTGJSON is the planned source.
**Decision:**
1. Sync **constructed** MTGJSON deck types only — use real DeckList strings (`Commander Deck`, `Duel Deck`, `Challenger Deck`, `Starter Deck`, `Intro Pack`, `Theme Deck`, …). Exclude Jumpstart, Secret Lair Drop, Deck Builder’s Toolkit, Bundle Land Pack, Box Set, MTGO Redemption, etc.
2. Map type (+ name/code hints) → Scryfall browse `format`; skip when unmappable.
3. Store `Precon` / `PreconCard` (oracle + board + optional preferred printing via Scryfall id / set+cn). Omit tokens from the checklist.
4. Fork copies all lines into a private `Deck` with `sourcePreconId`; legality surfaces in the editor (no silent drops).
5. UI: `/precons` browse + `/precons/[slug]` detail with Owned/Missing chips and Fork CTA.
**Consequences:** Precons depend on Scryfall printings being indexed first; monthly/`--if-changed` sync via `npm run sync:mtgjson-precons` (local) and `.github/workflows/sync-mtgjson-precons.yml` (1st of month 05:00 UTC + manual dispatch). Short keys like `commander` alone never appear in DeckList — matching must use the human-readable `type` field.

## 2026-07-30 — Phase 3 analysis scope (in-builder only)
**Context:** Roadmap listed precon/publication compare (3.5) and a dedicated `/decks/[id]/analysis` page (3.6). Precon diffs are a poor fit (decks diverge by design); a second analysis surface duplicates the builder.
**Decision:**
1. Ship **3.1–3.4** only: composition (curve/types/lands/colors), role counts, theme overlap, soft format coherence — all in the deck editor meta panel.
2. **Cancel 3.5** (compare vs precon / own publications) and **3.6** (analysis route). `sourcePreconId` remains provenance for possible later Phase 4 corpus tools.
3. Charts: compact CSS bars/chips (no Recharts in v1) so the sticky meta panel stays light.
**Consequences:** Analysis extends `DeckInsightsPanel` / `src/lib/decks/{composition,insights,coherence}.ts`. Hard legality stays in `DeckLegalityPanel`; coherence is advisory only.

## 2026-07-30 — Archidekt-inspired deck stats (in-builder)
**Context:** Archidekt Deck stats (Colors / Mana curve / Probability / Quantities + header size/cost/salt/bracket) are a brewing benchmark. We want closer vision without EDHREC salt, official Bracket parity, or a separate analysis route.
**Decision:**
1. Evolve `DeckInsightsPanel` into tabbed stats: **Overview | Colors | Curve | Quantities | Odds**, with header `Size · Avg MV · Est cost · Lands`.
2. **Colors:** spell **pips** from `manaCost` + **production** from Scryfall `produced_mana` (lands-only toggle). No fragile oracle regex.
3. **Odds:** hypergeometric ≥1 in N (default 7) for lands / top roles / types.
4. **Out of v1:** salt sum, EDH Bracket estimate, user-editable categories, chart→focus, pin-to-side panel, Recharts.
**Consequences:** Est cost uses EUR-first preferred-printing prices (same grain as tiles). Roles stand in for Archidekt “categories” honestly labeled. GC remains the power/salt-ish signal.

## 2026-07-30 — Deck stats below list, grid not tabs
**Context:** Tabbed stats in the sticky meta panel crowded the editor chrome and hid sections behind clicks. Archidekt itself places stats under the list.
**Decision:** Move `DeckInsightsPanel` **below** the deck list/grid. Drop section tabs; show Overview · Colors · Curve · Quantities · Odds in a **responsive grid** (1 column → 2 from `md`), Odds full-width on wide viewports. Meta panel keeps name/format/legality/Add only.
**Consequences:** Supersedes the tabbed-in-meta layout from the prior Archidekt-inspired entry. Stats scroll with the page after the cards.

## 2026-07-30 — Deck stats single-column until section rework
**Context:** A 2-column grid locked spacing before the individual stats sections are redesigned.
**Decision:** Stack all deck-stats sections **vertically for now**. Revisit multi-column after the section rework settles content density.
**Consequences:** Supersedes the 1→2 column grid choice in the prior “below list” entry.

## 2026-07-30 — Colors stats: Archidekt structure, our chrome
**Context:** Archidekt Colors shows Cost/Production share bars plus per-color cards (% · pips/mana · cards) with mana icons and tinted bars.
**Decision:** Rebuild Colors via `DeckColorsStats` with that information architecture (share bars + always-visible WUBRG(+C) grid, % badges, pip/mana·cards). Keep include-colorless and lands-only-production toggles. Use Scryfall-aligned bar fills (`mana-palette`) and existing `ManaSymbol` — not Archidekt’s dark chrome or control icons.
**Consequences:** Percentages are share of total cost pips / production sources (not relative to the max color).

## 2026-07-30 — Mana curve stats: overall + facet mini-curves
**Context:** Archidekt Mana curve shows Avg/Total MV, an overall histogram, “Mana curve by” dropdown, and a grid of mini-curves (Color / Permanent / Categories / Types / …).
**Decision:** Ship `DeckCurveStats` with that structure. Facet modes **v1:** Color · Types · Permanent/non-permanent (data we already have). Defer Categories/roles, subtypes, rarity, power, toughness. Multicolor spells count in **each** cost color. Keep CMC buckets `0–6` + `7+` (not Archidekt `8+`). Bars use rounded tops + gaps; color mini-curves use `mana-palette` fills.
**Consequences:** `curveBreakdowns` on `DeckDetail` from `summarizeDeckCurveBreakdowns`. Dropdown lists only supported modes — no disabled stub options.

## 2026-07-30 — Mana curve facets: Roles, Subtypes, Rarity
**Context:** Archidekt also breaks mana curve by Categories, Subtypes, Rarity (plus Power/Toughness).
**Decision:** Add **Roles** (our classification categories — labeled Roles, not Categories), **Subtypes** (front-face `typeLine`, top 12 + Other + No subtype), and **Rarity** (preferred/catalog printing, fallback `Card.minRarity`). Still **defer Power/Toughness**. Multi-role / multi-subtype cards count in each matching series; untagged roles → Uncategorized.
**Consequences:** `DeckCardView.rarity` loaded for stats; no schema/migration. Power/toughness remain out until explicitly requested.

## 2026-07-30 — Quantities: Quantity-of select (Archidekt facets)
**Context:** Archidekt Quantities uses one selectable view (Categories / Types / Subtypes / Supertypes / Mana Value / Keywords). We previously stacked Roles+Types+MV always expanded and lacked subtypes/supertypes/keywords.
**Decision:** Ship `DeckQuantitiesStats` with a **Quantity of** select covering Roles · Types · Subtypes · Supertypes · Mana value · Keywords (main+commander; lands included). Keep our horizontal bars (not Archidekt’s vertical orange chart). Label Roles not Categories. Keywords from Scryfall `Card.keywords`.
**Consequences:** `quantityBreakdowns` on `DeckDetail`; `DeckCardView.keywords` loaded. One facet visible at a time.

## 2026-07-30 — Odds: At least/Exactly + facet select
**Context:** Archidekt Probability is “drawing At least|Exactly K by [facet] having drawn N”. Our Odds was fixed ≥1 with a mixed Land/roles/types list.
**Decision:** Ship `DeckOddsStats` with At least|Exactly · target K · by Card Name|Roles|Types|Subtypes|Mana value|Keywords · draws N. Reuse `quantityBreakdowns` + `cardNameQuantities`. Hypergeometric Exact via existing PMF. No mulligan model, no list-focus from row click.
**Consequences:** Table Label/Qty/Odds sorted by odds then qty. Grain remains main+commander.

## 2026-07-30 — Odds default facet by format
**Context:** On singleton / commander-like decks nearly every Card Name row is qty 1, so “by Card Name” is noisy as a default.
**Decision:** Default Odds facet = **Types** for commander-like formats (`isCommanderLikeFormat`); **Card Name** for multi-copy constructed. Changing format resets the facet to that default. Card Name remains selectable in all formats.
**Consequences:** `defaultOddsFacetForFormat` in `odds-rows.ts`; `DeckOddsStats` takes `format`.

## 2026-07-30 — Overview as stats dashboard
**Context:** Overview duplicated Size and listed themes/GC/skeleton without summarizing Colors/Curve/Quantities/Odds; deleting it would orphan coherence/GC/themes/skeleton.
**Decision:** Rework Overview into `DeckOverviewStats`: coherence alerts, snapshot tiles (GC, top role/type, curve peak, land odds, themed %), top pip chips, mini-curve, compact skeleton bars, one-line themes. Detail lists stay in the specialized sections.
**Consequences:** Overview is a brew dashboard, not a fourth quantities list.

## 2026-07-30 — Deck list columns: allow type-group splits
**Context:** `break-inside-avoid` on whole type subsections (e.g. all Creatures) forced one tall column and left Sorcery/Artifact/Land short — uneven Goldfish columns.
**Decision:** Prefer **column balance**: type groups may split across columns; keep `break-after-avoid` on board/type headings and `break-inside-avoid` on individual rows. Enable `column-fill: balance` on the list container. Same for precon list view.
**Consequences:** A Creature header can sit above a partial list that continues in the next column; heights stay closer across columns.

## 2026-07-30 — Deck stats mosaic layout (lg+)
**Context:** After section rework, full-width stacked stats felt stretched on large screens; a rigid 2-col grid would equal-height stretch cells.
**Decision:** Use CSS multi-column mosaico: `columns-1` below `lg`, `lg:columns-2` with each `StatCell` `break-inside-avoid` + `mb-4` so heights follow content. Cap Odds table with `max-h-[min(28rem,70vh)] overflow-auto`. No masonry library / no tabs.
**Consequences:** Supersedes the temporary “single-column until section rework” choice. Desktop shows side-by-side variable-height sections; Odds scroll internally when long.

## 2026-07-30 — Deck list as preview card grid
**Context:** `/decks` was a dense text list; Archidekt-style browse shows cover art + mana distribution. We want grid parity with sets/precons without public views/tags/author chrome.
**Decision:**
1. **Layout:** `CARD_FACE_GRID_CLASS` (browse card column density, not set/precon rows) — cover crop, cost share bar, overlay meta; whole card links to the editor; footer is name + Delete only.
2. **Cover:** commander board (first by name if partners) → highest-CMC non-land main → first main; preferred printing image then catalog.
3. **Cover image size:** display Scryfall **`art_crop`** (rewrite CDN size segment from stored `normal`) so the frame/name bar is not visible — same idea as Archidekt. No schema change; catalog still stores `normal`.
4. **Overlay:** `Format · sizeLabel · relative updated` (no views).
5. **Bar:** Cost pips only (`summarizeDeckManaPips`), shared `ManaShareBar` with Colors stats — not production or color identity.
**Consequences:** `listDecks` batch-loads card faces for cover + pips; picker list stays slim. No custom cover UX yet.

## 2026-07-30 — Precon PDP reuses deck stats panel
**Context:** Deck editor shipped Archidekt-inspired stats; precon detail only had list + owned/missing + fork.
**Decision:** Extract `buildDeckStatsFromCards` from `getDeckDetail`; widen `getPreconBySlug` (CI, produced mana, rarity, keywords, GC, classifications); mount `DeckInsightsPanel` below `PreconDeckView` as “Precon stats”. No legality strip on PDP. PLP set/precon card redesign follows as a separate slice.
**Consequences:** Editor and precon PDP share one stats pipeline; list-page Cost bars can reuse the same pip summarizer.

## 2026-07-30 — Sets/precons PLP preview cards
**Context:** Deck list shipped art_crop + Cost bar + browse-density grid; sets/precons still used wide set-icon rows.
**Decision:**
1. Shared `CatalogPreviewCard` on `CARD_FACE_GRID_CLASS` for `/sets`, `/precons`, and `/search` set hits.
2. Keep **set icon** in the footer on both PLPs.
3. **Sets cover:** first indexed printing (`collectorNumber` asc with `imageUri`); no mana bar.
4. **Precons:** existing preview face as art_crop + Cost pip bar (`loadPreconCostSegments`); drop hover floating preview.
**Consequences:** Precon list queries are heavier (full main/commander lines for pips); set browse/search load one cover printing per set on the page.

## 2026-07-30 — Precon browse filters: search widen + type + CI
**Context:** `/precons` only filtered format and searched name/code; users want set name, commander, product type, and color identity.
**Decision:**
1. **Search `q`:** name · code · set name (`MtgSet`) · commander card name (`PreconCard` board commander).
2. **Type** select from distinct `Precon.type`.
3. **Color identity:** denormalize `Precon.colorIdentity` at MTGJSON sync — commander CI union when present, else mainboard non-land union; browse pills use `hasEvery` for WUBRG and empty array for `C`.
**Consequences:** Requires migration + sync/backfill (`recomputeAllPreconColorIdentities`, also on `--if-changed` skip). Exact-CI-only toggle deferred.

## 2026-07-31 — Deck stats mosaic stacks until xl
**Context:** Two-column stats at `lg` felt cramped on mid-width deck/precon PDPs; sections need to stack earlier when shrinking.
**Decision:** Keep CSS multi-column mosaico; switch side-by-side from `lg:columns-2` to `xl:columns-2` (`columns-1` below `xl`). Same panel for deck editor and precon PDP.
**Consequences:** Supersedes the breakpoint in “Deck stats mosaic layout (lg+)”. Mosaic layout otherwise unchanged.

## 2026-07-31 — Deck stats: Overview row + fixed 2-col pairs
**Context:** CSS multi-column reordered cells by height; Overview should stay first, and wide layouts should pair Colors↔Curve and Quantities↔Odds explicitly.
**Decision:**
1. **Overview** first on its own row — full width; `2xl:max-w-[50%]` on very large screens (right half empty).
2. Below: two explicit pair rows (Colors | Mana curve, then Quantities | Odds), each `grid-cols-1` → `lg:grid-cols-2` with `items-start`.
3. Drop multi-column mosaico for this panel.
**Consequences:** Supersedes “Deck stats mosaic layout (lg+)” and “Deck stats mosaic stacks until xl” for section placement. Same panel for deck editor and precon PDP. Pair rows use `lg` (not `xl`) so side-by-side is visible on typical laptop widths.

## 2026-07-31 — Collection | Decks manage stacks until lg
**Context:** With both Collection and Decks CTAs always present, `sm:grid-cols-2` felt cramped in the card detail modal and on the PDP at mid widths.
**Decision:** `CardManagePanels` uses `grid-cols-1` → `lg:grid-cols-2` (stack below `lg`). Shared by modal and PDP.
**Consequences:** Side-by-side manage columns only from `lg` up; narrow/mid viewports get a full-width stack.

## 2026-07-31 — Deck Tokens & Extras (Archidekt parity)
**Context:** After deck/precon stats, users expect an Archidekt-style Tokens & Extras grid. Related parts were dropped from the card PDP; precon sync omitted MTGJSON tokens; token sets were skipped so printings were missing.
**Decision:**
1. Restore slim `card_relations` for Scryfall `all_parts` with `component` ∈ `{token, emblem}` only — used for **deck/precon Tokens inference**, not the card PDP Related section.
2. Ingest Scryfall **token** sets (memorabilia still skipped). Token/emblem layouts stay indexed but are excluded from default browse/FTS hub.
3. Deck board **`extras`**: editable in the builder; excluded from legality, copy limits, size label, and stats; separate cap `MAX_EXTRAS_CARDS` (100). Tokens tab is read-only inferred (+ “Add to extras”).
4. Precon sync stores MTGJSON `tokens[]` as `PreconCard.board = "token"` (not in owned/missing checklist). Fork maps those lines to deck `extras`.
5. UI: `DeckTokensExtrasSection` after `DeckInsightsPanel` on editor + precon PDP (precon hides empty Extras tab).
**Consequences:** Requires migrate + sets/printings/oracle sync (relations) + MTGJSON precon resync for populated Tokens tabs.
**Supersedes:** “Drop Related parts / card_relations” for **deck inference only** (card PDP Related stays gone). Supersedes Phase 2.3 “Omit tokens from the checklist” for product token storage (still omitted from owned/missing checklist).
**Superseded by:** “Tokens & Extras inferred (drop extras board)” (same day) for editable extras board / Tokens-vs-Extras split.

## 2026-07-31 — Resolve `all_parts` ids via printing + token name
**Context:** Scryfall `all_parts[].id` is often a **printing** UUID, not the `oracle_cards` representative id. Oracle sync only looked up `Card.id`, so most token edges (Treasure, Clue, …) never wrote to `card_relations` (~1.2k rows) and deck Tokens tabs stayed empty even after a full oracle sync.
**Decision:** When writing relations, resolve related id as: (1) `Card.id`, else (2) `Printing.id` → `oracleId`, else (3) exact name among `token` / `double_faced_token` / `emblem` layouts.
**Consequences:** Re-run `npm run sync:scryfall` (oracle pass) after deploy; printings sync improves path (2) and token art, but name fallback works from oracle tokens alone.

## 2026-07-31 — Emblems via `combo_piece` all_parts
**Context:** Scryfall tags many planeswalker emblems (e.g. Kaito, Bane of Nightmares) as `all_parts[].component = combo_piece` with `type_line = Emblem`, not `token`. Sync only accepted `component === "token"`, so emblems never entered `card_relations` and Tokens tabs stayed empty for those decks.
**Decision:** Also accept `combo_piece` when `type_line` matches Emblem or Token; map Emblem → `emblem`, Token → `token`. Ignore other combo pieces (meld partners, alt printings of the same card, etc.).
**Consequences:** Re-run `npm run sync:scryfall` after deploy. Extras board remains user/precon-filled only — not inferred from `all_parts`.
**Superseded by:** “Tokens & Extras inferred (drop extras board)” (same day).

## 2026-07-31 — Tokens & Extras inferred (drop extras board)
**Context:** Editable `DeckCard.board = extras` + “Add to extras” mismatched the product: Tokens/Extras are consequences of cards in the list, not a separate board. Emblems were also wrongly lumped under Tokens.
**Decision:**
1. **Tokens** = inferred `card_relations` with `component = token` (plus MTGJSON precon product tokens on the precon PDP).
2. **Extras** = inferred non-token related parts (`component = extra`: emblems, meld partners/results, other `combo_piece` / related oracles ≠ source).
3. Both tabs **read-only** — change only by adding/removing generating cards.
4. Remove editable extras board (schema cleanup deletes existing `board=extras` rows; fork precon no longer copies product tokens onto the deck).
5. Enum rename: `CardRelationComponent.emblem` → `extra`. Sync accepts `token`, and `combo_piece` / `meld_part` / `meld_result` (token type_line → `token`, else → `extra`).
**Consequences:** Re-run migrate + `npm run sync:scryfall`. Kaito’s emblem appears under Extras. No Add to extras / qty on the section.
**Supersedes:** “Deck Tokens & Extras (Archidekt parity)” board-editability clauses; “Emblems via combo_piece all_parts” mapping to `emblem` / ignore-other-combo.

## 2026-07-31 — Extras = emblems only (not all combo_piece)
**Context:** Accepting every Scryfall `combo_piece` as Extra pulled in Alchemy rebalances (A-Blood Artist), conjure targets (Gilded Goose), and other playable cards into the Extras tab.
**Decision:** Keep Tokens = token-typed parts; Extras = **Emblem** type_line only (often tagged `combo_piece`). Ignore other `combo_piece` / meld links. Name fallback resolves only `token` / `double_faced_token` / `emblem` layouts.
**Consequences:** Re-run `npm run sync:scryfall`. Extras tab shows PW emblems etc., not Alchemy/conjure relatives.
**Supersedes:** “Tokens & Extras inferred” clause that mapped all non-token combo/meld → `extra`.
**Superseded by:** “Tokens/Extras denylist playable cards” (same day).

## 2026-07-31 — Tokens/Extras denylist playable cards
**Context:** Allowlisting only Emblem missed City's Blessing / The Monarch / Dungeons. Allowlisting every `combo_piece` pulled Alchemy + conjure targets. Safer: denylist **playable main-deck cards**.
**Decision:** Collect `token` / `combo_piece` / meld all_parts; resolve related oracle; **drop** if playable deck card (normal/saga/… layouts unless type is Dungeon/Conspiracy/Plane/Scheme/Phenomenon/Vanguard). Classify remainder: type `Token` → Tokens; else (emblem, layout-token markers like City's Blessing `Card`, dungeons, …) → Extras. Helpers in `src/lib/decks/relation-classify.ts`.
**Consequences:** Re-run `npm run sync:scryfall`. Alchemy/conjure stay out; emblems + City's Blessing-style markers stay in Extras.
**Supersedes:** “Extras = emblems only (not all combo_piece)”.

## 2026-07-31 — Tokens & Extras stacked + shared List/Grid
**Context:** Tokens|Extras tabs hid one list; users want both visible and the same List/Grid control as the deck.
**Decision:** Stack Tokens then Extras (omit empty groups). Replace the category tabs with `DeckViewToggle`, sharing `mtgplayground.deckEditorView` / `preconDeckView`. List mode uses Goldfish-style name rows (+ type line); grid keeps face tiles.
**Consequences:** Toggling view in the section syncs with the main deck/precon list above.
