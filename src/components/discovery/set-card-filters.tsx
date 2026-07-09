import Link from "next/link";

import { SET_RARITIES, type SetCardFilters } from "@/lib/scryfall/sets";

type SetCardFiltersProps = {
  setCode: string;
  filters: SetCardFilters;
};

const COLOR_OPTIONS = ["W", "U", "B", "R", "G", "C"] as const;

function buildHref(setCode: string, next: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(next)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/sets/${setCode}?${query}` : `/sets/${setCode}`;
}

export function SetCardFilters({ setCode, filters }: SetCardFiltersProps) {
  const current = {
    q: filters.query,
    rarity: filters.rarities?.join(","),
    color: filters.colors?.join(","),
    commander: filters.commanderLegal ? "legal" : undefined,
  };

  return (
    <section className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={filters.query ?? ""}
          placeholder="Filter by card name..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        {current.rarity && <input type="hidden" name="rarity" value={current.rarity} />}
        {current.color && <input type="hidden" name="color" value={current.color} />}
        {current.commander && <input type="hidden" name="commander" value={current.commander} />}
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rarity</p>
        <div className="flex flex-wrap gap-2">
          {SET_RARITIES.map((rarity) => {
            const selected = filters.rarities?.includes(rarity) ?? false;
            const nextRarities = selected
              ? (filters.rarities ?? []).filter((value) => value !== rarity)
              : [...(filters.rarities ?? []), rarity];

            return (
              <Link
                key={rarity}
                href={buildHref(setCode, {
                  ...current,
                  rarity: nextRarities.length ? nextRarities.join(",") : undefined,
                })}
                className={`rounded-full px-3 py-1 text-xs capitalize ${
                  selected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {rarity}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => {
            const selected = filters.colors?.includes(color) ?? false;
            const nextColors = selected
              ? (filters.colors ?? []).filter((value) => value !== color)
              : [...(filters.colors ?? []), color];

            return (
              <Link
                key={color}
                href={buildHref(setCode, {
                  ...current,
                  color: nextColors.length ? nextColors.join(",") : undefined,
                })}
                className={`rounded-full px-3 py-1 text-xs ${
                  selected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {color}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref(setCode, {
            ...current,
            commander: filters.commanderLegal ? undefined : "legal",
          })}
          className={`rounded-full px-3 py-1 text-xs ${
            filters.commanderLegal
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          }`}
        >
          Commander legal
        </Link>

        {(filters.query ||
          filters.rarities?.length ||
          filters.colors?.length ||
          filters.commanderLegal) && (
          <Link
            href={`/sets/${setCode}`}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            Clear filters
          </Link>
        )}
      </div>
    </section>
  );
}
