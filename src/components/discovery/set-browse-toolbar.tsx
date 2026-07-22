import {
  BrowseFilterPill,
  BrowseFilterPillRow,
  BrowseFilterSection,
  BrowseSearchField,
  BrowseSelectField,
} from "@/components/discovery/browse-filter-controls";
import { BrowseFilterPanel, BrowseFilterPanelRow } from "@/components/discovery/browse-filter-panel";
import {
  browseToolbarDenseGridClassName,
} from "@/components/discovery/browse-toolbar-shared";
import {
  defaultSetBrowseOrder,
  defaultSetBrowseSort,
  getSetBrowseSortOptions,
  type SetBrowseSort,
  type SetTypeFilterOption,
} from "@/lib/browse/sets-shared";

export type SetBrowseToolbarState = {
  query: string;
  sort: SetBrowseSort;
  order: "asc" | "desc";
  setType: string;
  digital: "" | "true" | "false";
  indexedOnly: boolean;
};

type SetBrowseToolbarProps = {
  state: SetBrowseToolbarState;
  onChange: (patch: Partial<SetBrowseToolbarState>) => void;
  typeOptions: SetTypeFilterOption[];
};

export function SetBrowseToolbar({ state, onChange, typeOptions }: SetBrowseToolbarProps) {
  const sortOptions = getSetBrowseSortOptions();
  const hasActiveFilters = Boolean(
    state.query.trim() || state.setType || state.digital || state.indexedOnly,
  );

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarDenseGridClassName}>
        <BrowseSearchField
          label="Search in browse"
          value={state.query}
          onChange={(query) => onChange({ query })}
          placeholder="Name or code (min. 2 chars)..."
        />

        <BrowseSelectField
          label="Sort by"
          value={state.sort}
          onChange={(sort) => onChange({ sort: sort as SetBrowseSort })}
          options={sortOptions}
        />

        <BrowseSelectField
          label="Set type"
          value={state.setType}
          onChange={(setType) => onChange({ setType })}
          options={typeOptions}
        />

        <BrowseSelectField
          label="Digital"
          value={state.digital}
          onChange={(digital) =>
            onChange({ digital: digital as SetBrowseToolbarState["digital"] })
          }
          options={[
            { value: "", label: "Any" },
            { value: "false", label: "Paper only" },
            { value: "true", label: "Digital only" },
          ]}
        />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{ order: state.order, onChange: (order) => onChange({ order }) }}
        clearFilters={{
          visible: hasActiveFilters,
          onClear: () =>
            onChange({
              query: "",
              setType: "",
              digital: "",
              indexedOnly: false,
            }),
        }}
      >
        <BrowseFilterSection title="Options">
          <BrowseFilterPillRow>
            <BrowseFilterPill
              label="Indexed only"
              selected={state.indexedOnly}
              onClick={() => onChange({ indexedOnly: !state.indexedOnly })}
            />
          </BrowseFilterPillRow>
        </BrowseFilterSection>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function defaultSetBrowseToolbarState(): SetBrowseToolbarState {
  const sort = defaultSetBrowseSort();

  return {
    query: "",
    sort,
    order: defaultSetBrowseOrder(sort),
    setType: "",
    digital: "",
    indexedOnly: false,
  };
}

export function buildSetBrowseSearchParams(
  state: SetBrowseToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  if (state.setType) params.set("set_type", state.setType);
  if (state.digital) params.set("digital", state.digital);
  if (state.indexedOnly) params.set("indexed", "true");

  return params;
}
