"use client";

import {
  BrowseColorPillGroup,
  BrowseSearchField,
  BrowseSelectField,
  BrowseToolbarPillGroups,
} from "@/components/discovery/browse-filter-controls";
import {
  BrowseFilterPanel,
  BrowseFilterPanelRow,
} from "@/components/discovery/browse-filter-panel";
import { browseToolbarDenseGridClassName } from "@/components/discovery/browse-toolbar-shared";
import { colorsToParam } from "@/lib/browse/color-identity-filter";
import { getBrowseFormatFilterOptions } from "@/lib/formats/scryfall-formats";
import type {
  PreconOrder,
  PreconSort,
  PreconTypeFilterOption,
} from "@/lib/precons/precons";

export type PreconBrowseToolbarState = {
  query: string;
  format: string;
  type: string;
  colors: string[];
  sort: PreconSort;
  order: PreconOrder;
};

type PreconBrowseToolbarProps = {
  state: PreconBrowseToolbarState;
  onChange: (patch: Partial<PreconBrowseToolbarState>) => void;
  typeOptions: PreconTypeFilterOption[];
};

const SORT_OPTIONS = [
  { value: "release", label: "Release date" },
  { value: "name", label: "Name" },
];

const DEFAULT_STATE: PreconBrowseToolbarState = {
  query: "",
  format: "",
  type: "",
  colors: [],
  sort: "release",
  order: "desc",
};

export function PreconBrowseToolbar({
  state,
  onChange,
  typeOptions,
}: PreconBrowseToolbarProps) {
  const formatOptions = [
    { value: "", label: "All formats" },
    ...getBrowseFormatFilterOptions().map((f) => ({
      value: f.value,
      label: f.label,
    })),
  ];

  const hasActiveFilters = Boolean(
    state.query.trim() ||
      state.format ||
      state.type ||
      state.colors.length ||
      state.sort !== DEFAULT_STATE.sort ||
      state.order !== DEFAULT_STATE.order,
  );

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarDenseGridClassName}>
        <BrowseSearchField
          label="Search"
          value={state.query}
          onChange={(query) => onChange({ query })}
          placeholder="Name, set, or commander…"
        />
        <BrowseSelectField
          label="Sort by"
          value={state.sort}
          onChange={(sort) => {
            const nextSort: PreconSort = sort === "name" ? "name" : "release";
            onChange({
              sort: nextSort,
              order:
                nextSort === "name"
                  ? "asc"
                  : nextSort === "release"
                    ? "desc"
                    : state.order,
            });
          }}
          options={SORT_OPTIONS}
        />
        <BrowseSelectField
          label="Format"
          value={state.format}
          onChange={(format) => onChange({ format })}
          options={formatOptions}
        />
        <BrowseSelectField
          label="Type"
          value={state.type}
          onChange={(type) => onChange({ type })}
          options={typeOptions}
        />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{
          order: state.order,
          onChange: (order) => onChange({ order }),
        }}
        clearFilters={{
          visible: hasActiveFilters,
          onClear: () => onChange({ ...DEFAULT_STATE }),
        }}
      >
        <BrowseToolbarPillGroups>
          <BrowseColorPillGroup
            colors={state.colors}
            onChange={(colors) => onChange({ colors })}
          />
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function buildPreconBrowseSearchParams(
  state: PreconBrowseToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.format) params.set("format", state.format);
  if (state.type) params.set("type", state.type);
  const colorParam = colorsToParam(state.colors);
  if (colorParam) params.set("color", colorParam);
  if (state.sort !== "release") params.set("sort", state.sort);
  if (state.order !== "desc") params.set("order", state.order);
  if (cursor) params.set("cursor", cursor);
  return params;
}
