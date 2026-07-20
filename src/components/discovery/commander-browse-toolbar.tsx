"use client";

import {
  BrowseCatalogFilterFields,
  BrowseColorPillGroup,
  BrowseSearchField,
  BrowseSelectField,
} from "@/components/discovery/browse-filter-controls";
import { BrowseFilterPanel, BrowseFilterPanelRow } from "@/components/discovery/browse-filter-panel";
import { browseToolbarListGridClassName } from "@/components/discovery/browse-toolbar-shared";
import {
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
  getCommanderBrowseSortOptions,
  type CommanderBrowseSort,
} from "@/lib/browse/commanders-shared";
import { colorsToParam } from "@/lib/browse/color-identity-filter";

export type CommanderBrowseToolbarState = {
  query: string;
  sort: CommanderBrowseSort;
  order: "asc" | "desc";
  colors: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
};

type CommanderBrowseToolbarProps = {
  state: CommanderBrowseToolbarState;
  onChange: (patch: Partial<CommanderBrowseToolbarState>) => void;
};

export function CommanderBrowseToolbar({ state, onChange }: CommanderBrowseToolbarProps) {
  const sortOptions = getCommanderBrowseSortOptions();

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarListGridClassName}>
        <BrowseSearchField
          label="Search in list"
          value={state.query}
          onChange={(query) => onChange({ query })}
        />

        <BrowseSelectField
          label="Sort by"
          value={state.sort}
          onChange={(sort) => onChange({ sort: sort as CommanderBrowseSort })}
          options={sortOptions}
        />

        <BrowseCatalogFilterFields
          values={state}
          onChange={(patch) => onChange(patch)}
          typePlaceholder="e.g. Legendary Creature — Elf"
          inline
        />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{ order: state.order, onChange: (order) => onChange({ order }) }}
      >
        <BrowseColorPillGroup colors={state.colors} onChange={(colors) => onChange({ colors })} />
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function defaultCommanderBrowseToolbarState(): CommanderBrowseToolbarState {
  const sort = defaultSortForCommanderTab();

  return {
    query: "",
    sort,
    order: defaultOrderForCommanderTab(sort),
    colors: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
  };
}

export function buildCommanderBrowseSearchParams(
  state: CommanderBrowseToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  const colorParam = colorsToParam(state.colors);
  if (colorParam) params.set("color", colorParam);
  if (state.cmcMin) params.set("cmc_min", state.cmcMin);
  if (state.cmcMax) params.set("cmc_max", state.cmcMax);
  if (state.typeContains.trim()) params.set("type", state.typeContains.trim());

  return params;
}
