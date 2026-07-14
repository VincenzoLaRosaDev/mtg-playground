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
  defaultCatalogOrder,
  defaultCatalogSort,
  getCatalogBrowseSortOptions,
  type AllCardSort,
} from "@/lib/browse/cards-shared";
import { appendCatalogFilterParams } from "@/lib/browse/catalog-filter-params";

export type CatalogBrowseToolbarState = {
  query: string;
  sort: AllCardSort;
  order: "asc" | "desc";
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  commanderLegal: boolean;
  commandersOnly: boolean;
};

type CatalogBrowseToolbarProps = {
  state: CatalogBrowseToolbarState;
  onChange: (patch: Partial<CatalogBrowseToolbarState>) => void;
};

export function CatalogBrowseToolbar({ state, onChange }: CatalogBrowseToolbarProps) {
  const sortOptions = getCatalogBrowseSortOptions();

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarListGridClassName}>
        <BrowseSearchField
          label="Search in catalog"
          value={state.query}
          onChange={(query) => onChange({ query })}
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
              <BrowseFilterPill
                label="Commanders only"
                selected={state.commandersOnly}
                onClick={() => onChange({ commandersOnly: !state.commandersOnly })}
              />
            </BrowseFilterPillRow>
          </BrowseFilterSection>
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function defaultCatalogBrowseToolbarState(): CatalogBrowseToolbarState {
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
    commanderLegal: false,
    commandersOnly: false,
  };
}

export function buildCatalogBrowseSearchParams(
  state: CatalogBrowseToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    tab: "all",
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  appendCatalogFilterParams(params, state);

  return params;
}
