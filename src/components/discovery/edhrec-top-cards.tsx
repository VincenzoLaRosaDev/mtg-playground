import Link from "next/link";

import type { EdhrecCardList } from "@/lib/edhrec/types";
import {
  formatInclusionPercent,
  getTopCardsFromCommanderCardlists,
} from "@/lib/edhrec/cardlists";

type EdhrecTopCardsProps = {
  cardlists: Record<string, EdhrecCardList>;
  numDecks?: number | null;
  title?: string;
};

export function EdhrecTopCards({
  cardlists,
  numDecks,
  title = "Top cards",
}: EdhrecTopCardsProps) {
  const cards = getTopCardsFromCommanderCardlists(cardlists).slice(0, 10);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {cards.map((card) => {
          const inclusion = card.inclusion ?? card.num_decks ?? 0;
          const denominator = card.potential_decks ?? numDecks ?? 0;

          return (
            <li
              key={card.sanitized ?? card.name}
              className="flex items-center justify-between gap-4 text-sm"
            >
              {card.sanitized ? (
                <Link
                  href={`/cards/${card.sanitized}`}
                  className="font-medium hover:underline"
                >
                  {card.name}
                </Link>
              ) : (
                <span className="font-medium">{card.name}</span>
              )}
              <span className="shrink-0 text-zinc-500">
                {formatInclusionPercent(inclusion, denominator)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
