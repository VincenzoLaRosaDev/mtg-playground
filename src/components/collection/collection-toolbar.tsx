"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  BrowseCatalogFilterFields,
  BrowseColorPillGroup,
  BrowseFilterPill,
  BrowseFilterPillRow,
  BrowseFilterSection,
  BrowseRarityPillGroup,
  BrowseSearchField,
  BrowseSelectField,
  BrowseToolbarField,
  BrowseToolbarPillGroups,
} from "@/components/discovery/browse-filter-controls";
import {
  BrowseFilterPanel,
  BrowseFilterPanelRow,
} from "@/components/discovery/browse-filter-panel";
import { browseToolbarCollectionGridClassName } from "@/components/discovery/browse-toolbar-shared";
import { Input } from "@/components/ui/input";
import type { BrowseOrder } from "@/lib/browse/types";
import type { CollectionFilter } from "@/lib/collection/collection-filters";
import {
  buildCollectionSearchParams,
  COLLECTION_FINISH_OPTIONS,
  collectionFormatFilterOptions,
  hasActiveCollectionFacets,
  parseCollectionListQuery,
  type CollectionListQuery,
} from "@/lib/collection/collection-filters";
import {
  COLLECTION_SORT_OPTIONS,
  defaultCollectionOrder,
  type CollectionSort,
} from "@/lib/collection/collection-sort";
import type { ScryfallBrowseFormat } from "@/lib/formats/scryfall-formats";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { cn } from "@/lib/utils";

const SCOPE_FILTERS: { id: CollectionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owned", label: "Owned" },
  { id: "wantlist", label: "Wish" },
];

/** Debounce for text/number fields that would otherwise SSR-navigate on every keystroke. */
const TEXT_FILTER_DEBOUNCE_MS = 300;

type ToolbarState = {
  filter: CollectionFilter;
  query: string;
  sort: CollectionSort;
  order: BrowseOrder;
  colors: string[];
  rarities: string[];
  finishes: PrintingFinish[];
  typeContains: string;
  cmcMin: string;
  cmcMax: string;
  format: ScryfallBrowseFormat | "";
  setQuery: string;
};

type CollectionToolbarProps = {
  actions?: ReactNode;
};

function toToolbarState(query: CollectionListQuery): ToolbarState {
  return {
    filter: query.filter,
    query: query.query ?? "",
    sort: query.sort,
    order: query.order,
    colors: query.colors ?? [],
    rarities: query.rarities ?? [],
    finishes: query.finishes ?? [],
    typeContains: query.typeContains ?? "",
    cmcMin: query.cmcMin != null ? String(query.cmcMin) : "",
    cmcMax: query.cmcMax != null ? String(query.cmcMax) : "",
    format: query.format ?? "",
    setQuery: query.setQuery ?? "",
  };
}

function toListQuery(state: ToolbarState): CollectionListQuery {
  return {
    filter: state.filter,
    query: state.query.trim() || undefined,
    sort: state.sort,
    order: state.order,
    colors: state.colors,
    rarities: state.rarities,
    finishes: state.finishes,
    typeContains: state.typeContains.trim() || undefined,
    cmcMin: state.cmcMin ? Number(state.cmcMin) : undefined,
    cmcMax: state.cmcMax ? Number(state.cmcMax) : undefined,
    format: state.format || undefined,
    setQuery: state.setQuery.trim() || undefined,
  };
}

function textKey(state: ToolbarState): string {
  return [state.query, state.typeContains, state.cmcMin, state.cmcMax, state.setQuery].join(
    "\0",
  );
}

function facetsFromState(state: ToolbarState) {
  return {
    query: state.query.trim() || undefined,
    colors: state.colors,
    rarities: state.rarities,
    finishes: state.finishes,
    typeContains: state.typeContains.trim() || undefined,
    cmcMin: state.cmcMin ? Number(state.cmcMin) : undefined,
    cmcMax: state.cmcMax ? Number(state.cmcMax) : undefined,
    format: state.format || undefined,
    setQuery: state.setQuery.trim() || undefined,
  };
}

export function CollectionToolbar({ actions }: CollectionToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQuery = useMemo(
    () =>
      parseCollectionListQuery({
        filter: searchParams.get("filter"),
        sort: searchParams.get("sort"),
        order: searchParams.get("order"),
        q: searchParams.get("q"),
        color: searchParams.get("color"),
        rarity: searchParams.get("rarity"),
        type: searchParams.get("type"),
        cmc_min: searchParams.get("cmc_min"),
        cmc_max: searchParams.get("cmc_max"),
        format: searchParams.get("format"),
        finish: searchParams.get("finish"),
        set: searchParams.get("set"),
      }),
    [searchParams],
  );
  const urlState = useMemo(() => toToolbarState(urlQuery), [urlQuery]);

  const [draft, setDraft] = useState<ToolbarState>(urlState);
  const draftRef = useRef(draft);
  draftRef.current = draft;
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
      setDraft((current) => ({
        ...urlState,
        query: current.query,
        typeContains: current.typeContains,
        cmcMin: current.cmcMin,
        cmcMax: current.cmcMax,
        setQuery: current.setQuery,
      }));
      return;
    }

    setDraft(urlState);
  }, [urlState]);

  function navigate(next: ToolbarState) {
    const params = buildCollectionSearchParams(toListQuery(next));
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  function commit(next: ToolbarState) {
    pendingTextKeyRef.current = textKey(next);
    setDraft(next);
    navigate(next);
  }

  function patchDraft(patch: Partial<ToolbarState>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function patchImmediate(patch: Partial<ToolbarState>) {
    const next = { ...draftRef.current, ...patch };
    commit(next);
  }

  useEffect(() => {
    if (textKey(draft) === textKey(urlState)) {
      return;
    }

    const timeout = setTimeout(() => {
      navigate(draftRef.current);
      pendingTextKeyRef.current = textKey(draftRef.current);
    }, TEXT_FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional text-field debounce
  }, [draft.query, draft.typeContains, draft.cmcMin, draft.cmcMax, draft.setQuery]);

  const formatOptions = collectionFormatFilterOptions();
  const setFieldId = useId();
  const showClear = hasActiveCollectionFacets(facetsFromState(draft));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-1" aria-label="Collection scope">
          {SCOPE_FILTERS.map((entry) => {
            const active = draft.filter === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => patchImmediate({ filter: entry.id })}
                className={cn(
                  "cursor-pointer rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </nav>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <BrowseFilterPanel>
        <div className={browseToolbarCollectionGridClassName}>
          <BrowseSearchField
            label="Search collection"
            value={draft.query}
            onChange={(query) => patchDraft({ query })}
            placeholder={CARD_TEXT_SEARCH_PLACEHOLDER}
          />

          <BrowseSelectField
            label="Sort by"
            value={draft.sort}
            onChange={(sort) =>
              patchImmediate({
                sort: sort as CollectionSort,
                order: defaultCollectionOrder(sort as CollectionSort),
              })
            }
            options={COLLECTION_SORT_OPTIONS}
          />

          <BrowseToolbarField label="Set" htmlFor={setFieldId}>
            <Input
              id={setFieldId}
              type="text"
              value={draft.setQuery}
              onChange={(event) => patchDraft({ setQuery: event.target.value })}
              placeholder="Code or name"
            />
          </BrowseToolbarField>

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
          sortOrder={{
            order: draft.order,
            onChange: (order) => patchImmediate({ order }),
          }}
          clearFilters={{
            visible: showClear,
            onClear: () =>
              commit(
                toToolbarState({
                  filter: urlQuery.filter,
                  sort: urlQuery.sort,
                  order: urlQuery.order,
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
            <BrowseFilterSection title="Finish">
              <BrowseFilterPillRow>
                {COLLECTION_FINISH_OPTIONS.map((option) => (
                  <BrowseFilterPill
                    key={option.value}
                    label={option.label}
                    selected={draft.finishes.includes(option.value)}
                    onClick={() => {
                      const next = draft.finishes.includes(option.value)
                        ? draft.finishes.filter((finish) => finish !== option.value)
                        : [...draft.finishes, option.value];
                      patchImmediate({ finishes: next });
                    }}
                  />
                ))}
              </BrowseFilterPillRow>
            </BrowseFilterSection>
          </BrowseToolbarPillGroups>
        </BrowseFilterPanelRow>
      </BrowseFilterPanel>
    </div>
  );
}
