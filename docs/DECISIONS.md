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
