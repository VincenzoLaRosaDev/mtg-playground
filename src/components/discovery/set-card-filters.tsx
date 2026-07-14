"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

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
import { browseToolbarSetDetailGridClassName } from "@/components/discovery/browse-toolbar-shared";
import {
  buildSetCardSearchParams,
  hasActiveSetCardFilters,
  parseSetCardFiltersFromSearchParams,
} from "@/lib/scryfall/set-card-search-params";
import {
  defaultSetCardOrder,
  defaultSetCardSort,
  getSetCardSortOptions,
  type SetCardSort,
} from "@/lib/scryfall/set-card-sort";
import type { SetCardFilters } from "@/lib/scryfall/sets";

type SetCardFiltersProps = {
  setCode: string;
};

function toToolbarState(filters: SetCardFilters) {
  const sort = filters.sort ?? defaultSetCardSort();

  return {
    query: filters.query ?? "",
    sort,
    order: filters.order ?? defaultSetCardOrder(sort),
    rarities: filters.rarities ?? [],
    colors: filters.colors ?? [],
    typeContains: filters.typeContains ?? "",
    cmcMin: filters.cmcMin != null ? String(filters.cmcMin) : "",
    cmcMax: filters.cmcMax != null ? String(filters.cmcMax) : "",
    commanderLegal: filters.commanderLegal === true,
  };
}

export function SetCardFilters({ setCode }: SetCardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = useMemo(
    () => parseSetCardFiltersFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const state = toToolbarState(filters);
  const sortOptions = getSetCardSortOptions();

  function applyFilters(next: SetCardFilters) {
    const params = buildSetCardSearchParams(next);
    const query = params.toString();

    startTransition(() => {
      router.push(query ? `/sets/${setCode}?${query}` : `/sets/${setCode}`);
    });
  }

  function update(patch: Partial<typeof state>) {
    const merged = { ...state, ...patch };
    const sort = merged.sort as SetCardSort;

    applyFilters({
      query: merged.query.trim() || undefined,
      rarities: merged.rarities,
      colors: merged.colors,
      typeContains: merged.typeContains.trim() || undefined,
      cmcMin: merged.cmcMin ? Number(merged.cmcMin) : undefined,
      cmcMax: merged.cmcMax ? Number(merged.cmcMax) : undefined,
      commanderLegal: merged.commanderLegal ? true : undefined,
      sort,
      order: merged.order,
    });
  }

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarSetDetailGridClassName}>
        <BrowseSearchField
          label="Search in set"
          value={state.query}
          onChange={(query) => update({ query })}
          placeholder="Filter by card name..."
        />

        <BrowseSelectField
          label="Sort by"
          value={state.sort}
          onChange={(sort) =>
            update({
              sort: sort as SetCardSort,
              order: defaultSetCardOrder(sort as SetCardSort),
            })
          }
          options={sortOptions}
        />

        <BrowseCatalogFilterFields values={state} onChange={(patch) => update(patch)} inline />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{ order: state.order, onChange: (order) => update({ order }) }}
      >
        <BrowseToolbarPillGroups>
          <BrowseColorPillGroup colors={state.colors} onChange={(colors) => update({ colors })} />
          <BrowseRarityPillGroup
            rarities={state.rarities}
            onChange={(rarities) => update({ rarities })}
          />
          <BrowseFilterSection title="Options">
            <BrowseFilterPillRow>
              <BrowseFilterPill
                label="Commander legal"
                selected={state.commanderLegal}
                onClick={() => update({ commanderLegal: !state.commanderLegal })}
              />
              {hasActiveSetCardFilters(filters) ? (
                <BrowseFilterPill
                  label="Clear filters"
                  selected={false}
                  onClick={() =>
                    applyFilters({
                      sort: filters.sort,
                      order: filters.order,
                    })
                  }
                />
              ) : null}
            </BrowseFilterPillRow>
          </BrowseFilterSection>
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}
