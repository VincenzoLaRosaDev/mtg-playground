"use client";

import {
  BrowseCatalogFilterFields,
  BrowseColorPillGroup,
  BrowseRarityPillGroup,
  BrowseSearchField,
  BrowseSelectField,
  BrowseToolbarPillGroups,
} from "@/components/discovery/browse-filter-controls";
import { BrowseFilterPanel, BrowseFilterPanelRow } from "@/components/discovery/browse-filter-panel";
import { browseToolbarListGridClassName } from "@/components/discovery/browse-toolbar-shared";
import {
  defaultOrderForTab,
  defaultSortForTab,
  getCardBrowseSortOptions,
  type CardBrowseSort,
} from "@/lib/browse/cards-shared";
import { appendCatalogFilterParams } from "@/lib/browse/catalog-filter-params";
import {
  getBrowseFormatFilterOptions,
  type ScryfallBrowseFormat,
} from "@/lib/formats/scryfall-formats";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";

export type CardBrowseToolbarState = {
  query: string;
  sort: CardBrowseSort;
  order: "asc" | "desc";
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  format: ScryfallBrowseFormat | "";
};

type CardBrowseToolbarProps = {
  state: CardBrowseToolbarState;
  onChange: (patch: Partial<CardBrowseToolbarState>) => void;
};

export function CardBrowseToolbar({ state, onChange }: CardBrowseToolbarProps) {
  const sortOptions = getCardBrowseSortOptions();
  const formatOptions = getBrowseFormatFilterOptions();
  const hasActiveFilters = Boolean(
    state.query.trim() ||
      state.colors.length ||
      state.rarities.length ||
      state.typeContains.trim() ||
      state.cmcMin ||
      state.cmcMax ||
      state.format,
  );

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarListGridClassName}>
        <BrowseSearchField
          label="Search in list"
          value={state.query}
          onChange={(query) => onChange({ query })}
          placeholder={CARD_TEXT_SEARCH_PLACEHOLDER}
        />

        <BrowseSelectField
          label="Sort by"
          value={state.sort}
          onChange={(sort) => onChange({ sort: sort as CardBrowseSort })}
          options={sortOptions}
        />

        <BrowseCatalogFilterFields
          values={state}
          onChange={(patch) => onChange(patch)}
          inline
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
        clearFilters={{
          visible: hasActiveFilters,
          onClear: () =>
            onChange({
              query: "",
              colors: [],
              rarities: [],
              cmcMin: "",
              cmcMax: "",
              typeContains: "",
              format: "",
            }),
        }}
      >
        <BrowseToolbarPillGroups>
          <BrowseColorPillGroup colors={state.colors} onChange={(colors) => onChange({ colors })} />
          <BrowseRarityPillGroup
            rarities={state.rarities}
            onChange={(rarities) => onChange({ rarities })}
          />
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function defaultCardBrowseToolbarState(): CardBrowseToolbarState {
  const sort = defaultSortForTab();

  return {
    query: "",
    sort,
    order: defaultOrderForTab(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    format: "",
  };
}

export function buildCardBrowseSearchParams(
  state: CardBrowseToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  appendCatalogFilterParams(params, state);

  return params;
}
