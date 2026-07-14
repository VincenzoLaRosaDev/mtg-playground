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
  browseToolbarListGridClassName,
} from "@/components/discovery/browse-toolbar-shared";
import {
  defaultOrderForTab,
  defaultSortForTab,
  getCardBrowseSortOptions,
  type CardBrowseSort,
} from "@/lib/browse/cards-shared";
import { appendCatalogFilterParams } from "@/lib/browse/catalog-filter-params";
import {
  DEFAULT_EDHREC_CARD_TOP_WINDOW,
  type EdhrecCardTopWindowParam,
} from "@/lib/edhrec/top-window";

export type CardBrowseToolbarState = {
  query: string;
  sort: CardBrowseSort;
  order: "asc" | "desc";
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  commanderLegal: boolean;
};

type CardBrowseToolbarProps = {
  state: CardBrowseToolbarState;
  onChange: (patch: Partial<CardBrowseToolbarState>) => void;
};

export function CardBrowseToolbar({ state, onChange }: CardBrowseToolbarProps) {
  const sortOptions = getCardBrowseSortOptions();

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
          onChange={(sort) => onChange({ sort: sort as CardBrowseSort })}
          options={sortOptions}
        />

        <BrowseCatalogFilterFields
          values={state}
          onChange={(patch) => onChange(patch)}
          inline
        />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{ order: state.order, onChange: (order) => onChange({ order }) }}
      >
        <BrowseToolbarPillGroups>
          <BrowseColorPillGroup colors={state.colors} onChange={(colors) => onChange({ colors })} />
          <BrowseRarityPillGroup
            rarities={state.rarities}
            onChange={(rarities) => onChange({ rarities })}
          />
          <BrowseFilterSection title="Options">
            <BrowseFilterPillRow>
              <BrowseFilterPill
                label="Commander legal"
                selected={state.commanderLegal}
                onClick={() => onChange({ commanderLegal: !state.commanderLegal })}
              />
            </BrowseFilterPillRow>
          </BrowseFilterSection>
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function defaultCardBrowseToolbarState(
  _window: EdhrecCardTopWindowParam = DEFAULT_EDHREC_CARD_TOP_WINDOW,
): CardBrowseToolbarState {
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
    commanderLegal: false,
  };
}

export function buildCardBrowseSearchParams(
  state: CardBrowseToolbarState,
  cursor?: string | null,
  window?: EdhrecCardTopWindowParam,
): URLSearchParams {
  const params = new URLSearchParams({
    tab: "popular",
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (window) params.set("window", window);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  appendCatalogFilterParams(params, state);

  return params;
}
