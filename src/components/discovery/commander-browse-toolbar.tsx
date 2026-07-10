import {
  BROWSE_COLOR_OPTIONS,
  browseToolbarInputClassName,
  browseToolbarPanelClassName,
} from "@/components/discovery/browse-toolbar-shared";
import {
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
  getCommanderBrowseSortOptions,
  type CommanderBrowseSort,
  type CommanderBrowseTab,
} from "@/lib/browse/commanders-shared";

export type CommanderBrowseToolbarState = {
  query: string;
  sort: CommanderBrowseSort;
  order: "asc" | "desc";
  color: string;
  hasEdhrecMeta: "" | "true" | "false";
};

type CommanderBrowseToolbarProps = {
  tab: CommanderBrowseTab;
  state: CommanderBrowseToolbarState;
  onChange: (patch: Partial<CommanderBrowseToolbarState>) => void;
};

export function CommanderBrowseToolbar({ tab, state, onChange }: CommanderBrowseToolbarProps) {
  const sortOptions = getCommanderBrowseSortOptions(tab);

  return (
    <div className={browseToolbarPanelClassName}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Search in browse</span>
          <input
            type="search"
            value={state.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Min. 2 characters..."
            className={`${browseToolbarInputClassName} w-full`}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Sort by</span>
          <select
            value={state.sort}
            onChange={(event) => onChange({ sort: event.target.value as CommanderBrowseSort })}
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
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Color identity</span>
          <select
            value={state.color}
            onChange={(event) => onChange({ color: event.target.value })}
            className={`${browseToolbarInputClassName} w-full`}
          >
            {BROWSE_COLOR_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {tab === "all" && (
        <label className="block max-w-sm text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Popularity data</span>
          <select
            value={state.hasEdhrecMeta}
            onChange={(event) =>
              onChange({
                hasEdhrecMeta: event.target.value as CommanderBrowseToolbarState["hasEdhrecMeta"],
              })
            }
            className={`${browseToolbarInputClassName} w-full`}
          >
            <option value="">Any</option>
            <option value="true">Has popularity data</option>
            <option value="false">No popularity data</option>
          </select>
        </label>
      )}
    </div>
  );
}

export function defaultCommanderBrowseToolbarState(
  tab: CommanderBrowseTab,
): CommanderBrowseToolbarState {
  const sort = defaultSortForCommanderTab(tab);

  return {
    query: "",
    sort,
    order: defaultOrderForCommanderTab(tab, sort),
    color: "",
    hasEdhrecMeta: "",
  };
}

export function buildCommanderBrowseSearchParams(
  tab: CommanderBrowseTab,
  state: CommanderBrowseToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    tab,
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  if (state.color) params.set("color", state.color);
  if (tab === "all" && state.hasEdhrecMeta) {
    params.set("has_edhrec", state.hasEdhrecMeta);
  }

  return params;
}
