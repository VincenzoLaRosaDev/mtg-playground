import {
  browseToolbarInputClassName,
  browseToolbarPanelClassName,
} from "@/components/discovery/browse-toolbar-shared";
import {
  defaultSetBrowseOrder,
  defaultSetBrowseSort,
  getSetBrowseSortOptions,
  SET_BROWSE_TYPE_OPTIONS,
  type SetBrowseSort,
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
};

export function SetBrowseToolbar({ state, onChange }: SetBrowseToolbarProps) {
  const sortOptions = getSetBrowseSortOptions();

  return (
    <div className={browseToolbarPanelClassName}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Search in browse</span>
          <input
            type="search"
            value={state.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Name or code (min. 2 chars)..."
            className={`${browseToolbarInputClassName} w-full`}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Sort by</span>
          <select
            value={state.sort}
            onChange={(event) => onChange({ sort: event.target.value as SetBrowseSort })}
            className={`${browseToolbarInputClassName} w-full`}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Order</span>
          <select
            value={state.order}
            onChange={(event) =>
              onChange({ order: event.target.value === "asc" ? "asc" : "desc" })
            }
            className={`${browseToolbarInputClassName} w-full`}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Set type</span>
          <select
            value={state.setType}
            onChange={(event) => onChange({ setType: event.target.value })}
            className={`${browseToolbarInputClassName} w-full`}
          >
            {SET_BROWSE_TYPE_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Digital</span>
          <select
            value={state.digital}
            onChange={(event) =>
              onChange({
                digital: event.target.value as SetBrowseToolbarState["digital"],
              })
            }
            className={`${browseToolbarInputClassName} min-w-[10rem]`}
          >
            <option value="">Any</option>
            <option value="false">Paper only</option>
            <option value="true">Digital only</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pt-5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={state.indexedOnly}
            onChange={(event) => onChange({ indexedOnly: event.target.checked })}
            className="rounded border-zinc-300"
          />
          Indexed only (has set cards)
        </label>
      </div>
    </div>
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
