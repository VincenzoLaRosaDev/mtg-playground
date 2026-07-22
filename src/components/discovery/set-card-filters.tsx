"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  BrowseCatalogFilterFields,
  BrowseColorPillGroup,
  BrowseRarityPillGroup,
  BrowseSearchField,
  BrowseSelectField,
  BrowseToolbarPillGroups,
} from "@/components/discovery/browse-filter-controls";
import { BrowseFilterPanel, BrowseFilterPanelRow } from "@/components/discovery/browse-filter-panel";
import { browseToolbarSetDetailGridClassName } from "@/components/discovery/browse-toolbar-shared";
import {
  getBrowseFormatFilterOptions,
  type ScryfallBrowseFormat,
} from "@/lib/formats/scryfall-formats";
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

type ToolbarState = {
  query: string;
  sort: SetCardSort;
  order: "asc" | "desc";
  rarities: string[];
  colors: string[];
  typeContains: string;
  cmcMin: string;
  cmcMax: string;
  format: ScryfallBrowseFormat | "";
};

/** Debounce for text/number fields that would otherwise SSR-navigate on every keystroke. */
const TEXT_FILTER_DEBOUNCE_MS = 300;

function toToolbarState(filters: SetCardFilters): ToolbarState {
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
    format: filters.format ?? "",
  };
}

function toSetCardFilters(state: ToolbarState): SetCardFilters {
  return {
    query: state.query.trim() || undefined,
    rarities: state.rarities,
    colors: state.colors,
    typeContains: state.typeContains.trim() || undefined,
    cmcMin: state.cmcMin ? Number(state.cmcMin) : undefined,
    cmcMax: state.cmcMax ? Number(state.cmcMax) : undefined,
    format: state.format || undefined,
    sort: state.sort,
    order: state.order,
  };
}

function textKey(state: ToolbarState): string {
  return [state.query, state.typeContains, state.cmcMin, state.cmcMax].join("\0");
}

export function SetCardFilters({ setCode }: SetCardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlFilters = useMemo(
    () => parseSetCardFiltersFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const urlState = useMemo(() => toToolbarState(urlFilters), [urlFilters]);

  /** Local draft so typing stays responsive while URL/SSR catch up. */
  const [draft, setDraft] = useState<ToolbarState>(urlState);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  /** Text snapshot we last asked the router to apply — avoids clobbering newer keystrokes. */
  const pendingTextKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const incoming = textKey(urlState);
    const pending = pendingTextKeyRef.current;

    if (pending != null) {
      if (pending === incoming) {
        pendingTextKeyRef.current = null;
        setDraft(urlState);
        return;
      }
      // Stale or superseded navigation: keep local text, take discrete fields from URL.
      setDraft((current) => ({
        ...urlState,
        query: current.query,
        typeContains: current.typeContains,
        cmcMin: current.cmcMin,
        cmcMax: current.cmcMax,
      }));
      return;
    }

    // External URL change (back/forward, shared link).
    setDraft(urlState);
  }, [urlState]);

  function navigate(next: ToolbarState) {
    pendingTextKeyRef.current = textKey(next);
    const params = buildSetCardSearchParams(toSetCardFilters(next));
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/sets/${setCode}?${query}` : `/sets/${setCode}`);
    });
  }

  /** Immediate URL update (sort, pills, clear). */
  function commit(next: ToolbarState) {
    setDraft(next);
    navigate(next);
  }

  function patchImmediate(patch: Partial<ToolbarState>) {
    commit({ ...draftRef.current, ...patch });
  }

  /** Local-only update; debounced effect pushes text fields to the URL. */
  function patchDraft(patch: Partial<ToolbarState>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  useEffect(() => {
    if (textKey(draft) === textKey(urlState)) {
      return;
    }

    const timeout = setTimeout(() => {
      navigate(draftRef.current);
    }, TEXT_FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // navigate/urlState identity handled via textKey compare; setCode is stable per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional text-field debounce
  }, [draft.query, draft.typeContains, draft.cmcMin, draft.cmcMax, setCode]);

  const sortOptions = getSetCardSortOptions();
  const formatOptions = getBrowseFormatFilterOptions();
  const showClear =
    hasActiveSetCardFilters(toSetCardFilters(draft)) ||
    Boolean(draft.query || draft.typeContains || draft.cmcMin || draft.cmcMax);

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarSetDetailGridClassName}>
        <BrowseSearchField
          label="Search in set"
          value={draft.query}
          onChange={(query) => patchDraft({ query })}
          placeholder="Filter by card name..."
        />

        <BrowseSelectField
          label="Sort by"
          value={draft.sort}
          onChange={(sort) =>
            patchImmediate({
              sort: sort as SetCardSort,
              order: defaultSetCardOrder(sort as SetCardSort),
            })
          }
          options={sortOptions}
        />

        <BrowseCatalogFilterFields
          values={draft}
          onChange={(patch) => patchDraft(patch)}
          inline
        />

        <BrowseSelectField
          label="Format"
          value={draft.format}
          onChange={(format) =>
            patchImmediate({ format: (format as ScryfallBrowseFormat | "") || "" })
          }
          options={[{ value: "", label: "Any format" }, ...formatOptions]}
        />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{ order: draft.order, onChange: (order) => patchImmediate({ order }) }}
        clearFilters={{
          visible: showClear,
          onClear: () =>
            commit(
              toToolbarState({
                sort: urlFilters.sort,
                order: urlFilters.order,
              }),
            ),
        }}
      >
        <BrowseToolbarPillGroups>
          <BrowseColorPillGroup
            colors={draft.colors}
            onChange={(colors) => patchImmediate({ colors })}
          />
          <BrowseRarityPillGroup
            rarities={draft.rarities}
            onChange={(rarities) => patchImmediate({ rarities })}
          />
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}
