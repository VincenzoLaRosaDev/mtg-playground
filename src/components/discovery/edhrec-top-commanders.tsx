import Link from "next/link";

import type { EdhrecCardList } from "@/lib/edhrec/types";
import {
  formatInclusionPercent,
  getTopCommandersFromCardlists,
} from "@/lib/edhrec/cardlists";

type EdhrecTopCommandersProps = {
  cardlists: Record<string, EdhrecCardList>;
};

export function EdhrecTopCommanders({ cardlists }: EdhrecTopCommandersProps) {
  const commanders = getTopCommandersFromCardlists(cardlists).slice(0, 10);

  if (commanders.length === 0) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Top commanders
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Popularity data for commanders playing this card is not available yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Top commanders
      </h2>
      <ul className="mt-3 space-y-2">
        {commanders.map((commander) => (
          <li
            key={commander.sanitized ?? commander.name}
            className="flex items-center justify-between gap-4 text-sm"
          >
            {commander.sanitized ? (
              <Link
                href={`/commanders/${commander.sanitized}`}
                className="font-medium hover:underline"
              >
                {commander.name}
              </Link>
            ) : (
              <span className="font-medium">{commander.name}</span>
            )}
            <span className="shrink-0 text-zinc-500">
              {formatInclusionPercent(
                commander.inclusion ?? commander.num_decks ?? 0,
                commander.potential_decks ?? 0,
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
