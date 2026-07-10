import {
  BROWSE_COLOR_OPTIONS,
  browseToolbarInputClassName,
  browseToolbarPanelClassName,
} from "@/components/discovery/browse-toolbar-shared";
import {
  defaultSortForTab,
  getCardBrowseSortOptions,
  type CardBrowseSort,
  type CardBrowseTab,
} from "@/lib/browse/cards-shared";

export type CardBrowseToolbarState = {
  query: string;
  sort: CardBrowseSort;
  order: "asc" | "desc";
  color: string;
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  commanderLegal: boolean;
  hasEdhrec: "" | "true" | "false";
};

type CardBrowseToolbarProps = {
  tab: CardBrowseTab;
  state: CardBrowseToolbarState;
  onChange: (patch: Partial<CardBrowseToolbarState>) => void;
};

export function CardBrowseToolbar({ tab, state, onChange }: CardBrowseToolbarProps) {
  const sortOptions = getCardBrowseSortOptions(tab);

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
            onChange={(event) => onChange({ sort: event.target.value as CardBrowseSort })}
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Type contains</span>
          <input
            type="text"
            value={state.typeContains}
            onChange={(event) => onChange({ typeContains: event.target.value })}
            placeholder="e.g. Instant, Artifact"
            className={`${browseToolbarInputClassName} w-full`}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">CMC min</span>
          <input
            type="number"
            min={0}
            step={1}
            value={state.cmcMin}
            onChange={(event) => onChange({ cmcMin: event.target.value })}
            className={`${browseToolbarInputClassName} w-full`}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600 dark:text-zinc-400">CMC max</span>
          <input
            type="number"
            min={0}
            step={1}
            value={state.cmcMax}
            onChange={(event) => onChange({ cmcMax: event.target.value })}
            className={`${browseToolbarInputClassName} w-full`}
          />
        </label>

        {tab === "all" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Popularity data</span>
            <select
              value={state.hasEdhrec}
              onChange={(event) =>
                onChange({
                  hasEdhrec: event.target.value as CardBrowseToolbarState["hasEdhrec"],
                })
              }
              className={`${browseToolbarInputClassName} w-full`}
            >
              <option value="">Any</option>
              <option value="true">Has popularity data</option>
              <option value="false">No popularity data</option>
            </select>
          </label>
        ) : (
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={state.commanderLegal}
                onChange={(event) => onChange({ commanderLegal: event.target.checked })}
                className="rounded border-zinc-300"
              />
              Commander-legal only
            </label>
          </div>
        )}
      </div>

      {tab === "all" && (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={state.commanderLegal}
            onChange={(event) => onChange({ commanderLegal: event.target.checked })}
            className="rounded border-zinc-300"
          />
          Commander-legal only
        </label>
      )}
    </div>
  );
}

export function defaultCardBrowseToolbarState(tab: CardBrowseTab): CardBrowseToolbarState {
  return {
    query: "",
    sort: defaultSortForTab(tab),
    order: tab === "popular" ? "desc" : "asc",
    color: "",
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    commanderLegal: false,
    hasEdhrec: "",
  };
}

export function buildCardBrowseSearchParams(
  tab: CardBrowseTab,
  state: CardBrowseToolbarState,
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
  if (state.cmcMin) params.set("cmc_min", state.cmcMin);
  if (state.cmcMax) params.set("cmc_max", state.cmcMax);
  if (state.typeContains.trim()) params.set("type", state.typeContains.trim());
  if (state.commanderLegal) params.set("commander", "legal");
  if (tab === "all" && state.hasEdhrec) params.set("has_edhrec", state.hasEdhrec);

  return params;
}
