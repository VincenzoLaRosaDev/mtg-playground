"use client";

import {
  BrowseCatalogFilterFields,
  BrowseColorPillGroup,
  BrowseFilterPill,
  BrowseFilterPillRow,
  BrowseFilterSection,
  BrowseRarityPillGroup,
  BrowseSearchField,
  BrowseSelectField,
  BrowseToolbarPillGroups,
} from "@/components/discovery/browse-filter-controls";
import { BrowseFilterPanel, BrowseFilterPanelRow } from "@/components/discovery/browse-filter-panel";
import {
  browseToolbarHubPillGroupsClassName,
  browseToolbarHubPrimaryGridClassName,
  browseToolbarHubSecondaryGridClassName,
} from "@/components/discovery/browse-toolbar-shared";
import type { BrowseHubToolbarSnapshot } from "@/lib/browse/browse-defaults";
import {
  defaultCatalogOrder,
  defaultCatalogSort,
  getCatalogBrowseSortOptions,
  buildRoleFilterOptions,
  buildThemeFilterOptions,
  type AllCardSort,
} from "@/lib/browse/cards-shared";
import { appendCatalogFilterParams } from "@/lib/browse/catalog-filter-params";
import {
  getBrowseFormatFilterOptions,
  type ScryfallBrowseFormat,
} from "@/lib/formats/scryfall-formats";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";

export type BrowseHubToolbarState = BrowseHubToolbarSnapshot;

type BrowseHubToolbarProps = {
  state: BrowseHubToolbarState;
  onChange: (patch: Partial<BrowseHubToolbarState>) => void;
  /** Roles present in `card_classifications` (enum intersection). */
  presentRoles: string[];
  /** Themes present in `card_classifications` (enum intersection). */
  presentThemes: string[];
};

export function BrowseHubToolbar({
  state,
  onChange,
  presentRoles,
  presentThemes,
}: BrowseHubToolbarProps) {
  const sortOptions = getCatalogBrowseSortOptions();
  const roleOptions = buildRoleFilterOptions(presentRoles, state.role);
  const themeOptions = buildThemeFilterOptions(presentThemes, state.theme);
  const formatOptions = getBrowseFormatFilterOptions();

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarHubPrimaryGridClassName}>
        <BrowseSearchField
          label="Search in list"
          value={state.query}
          onChange={(query) => onChange({ query })}
          placeholder={CARD_TEXT_SEARCH_PLACEHOLDER}
        />

        <BrowseSelectField
          label="Sort by"
          value={state.sort}
          onChange={(sort) => onChange({ sort: sort as AllCardSort })}
          options={sortOptions}
        />

        <BrowseCatalogFilterFields
          values={state}
          onChange={(patch) => onChange(patch)}
          inline
        />
      </div>

      <div className={browseToolbarHubSecondaryGridClassName}>
        <BrowseSelectField
          label="Role"
          value={state.role}
          onChange={(role) => onChange({ role })}
          options={[{ value: "", label: "Any role" }, ...roleOptions]}
        />

        <BrowseSelectField
          label="Theme"
          value={state.theme}
          onChange={(theme) => onChange({ theme })}
          options={[{ value: "", label: "Any theme" }, ...themeOptions]}
        />

        <BrowseSelectField
          label="Format"
          value={state.format}
          onChange={(format) =>
            onChange({ format: (format as ScryfallBrowseFormat | "") || "" })
          }
          options={[{ value: "", label: "Any format" }, ...formatOptions]}
        />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{ order: state.order, onChange: (order) => onChange({ order }) }}
      >
        <BrowseToolbarPillGroups className={browseToolbarHubPillGroupsClassName}>
          <BrowseColorPillGroup colors={state.colors} onChange={(colors) => onChange({ colors })} />
          <BrowseRarityPillGroup
            rarities={state.rarities}
            onChange={(rarities) => onChange({ rarities })}
          />
          <BrowseFilterSection title="Options">
            <BrowseFilterPillRow>
              <BrowseFilterPill
                label="Commander"
                selected={state.commandersOnly}
                onClick={() => onChange({ commandersOnly: !state.commandersOnly })}
              />
              <BrowseFilterPill
                label="Game Changer"
                selected={state.gameChanger}
                onClick={() => onChange({ gameChanger: !state.gameChanger })}
              />
              <BrowseFilterPill
                label="Reserved"
                selected={state.reserved}
                onClick={() => onChange({ reserved: !state.reserved })}
              />
            </BrowseFilterPillRow>
          </BrowseFilterSection>
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function defaultBrowseHubToolbarState(): BrowseHubToolbarState {
  const sort = defaultCatalogSort();
  return {
    query: "",
    sort,
    order: defaultCatalogOrder(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    format: "",
    commandersOnly: false,
    role: "",
    theme: "",
    gameChanger: false,
    reserved: false,
  };
}

export function buildBrowseHubSearchParams(
  state: BrowseHubToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    entity: "cards",
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  appendCatalogFilterParams(params, {
    colors: state.colors,
    rarities: state.rarities,
    typeContains: state.typeContains,
    cmcMin: state.cmcMin,
    cmcMax: state.cmcMax,
    format: state.format,
    commandersOnly: state.commandersOnly,
  });

  if (state.commandersOnly) params.set("require_slug", "true");
  if (state.role) params.set("role", state.role);
  if (state.theme) params.set("theme", state.theme);
  if (state.gameChanger) params.set("gc", "1");
  if (state.reserved) params.set("reserved", "1");

  return params;
}
