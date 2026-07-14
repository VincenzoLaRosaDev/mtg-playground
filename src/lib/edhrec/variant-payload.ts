import type { EdhrecCardPage, EdhrecCommanderPage } from "@/lib/edhrec/types";
import { mapSimilarSlugs } from "@/lib/edhrec/parse";

export type CommanderVariantPayload = {
  name: string;
  rank: number | null;
  salt: number | null;
  numDecks: number | null;
  cardlists: unknown;
  tagCounts: Record<string, number>;
  similarSlugs: string[];
};

export type CardVariantPayload = {
  name: string;
  salt: number | null;
  numDecks: number | null;
  inclusion: number | null;
  potentialDecks: number | null;
  cardlists: unknown;
  similarCards: string[];
};

export function mapCommanderPageToVariantPayload(page: EdhrecCommanderPage): CommanderVariantPayload {
  const card = page.container.json_dict.card;

  return {
    name: card.name,
    rank: card.rank ?? null,
    salt: card.salt ?? null,
    numDecks: card.num_decks ?? null,
    cardlists: page.container.json_dict.cardlists ?? {},
    tagCounts: page.tag_counts ?? {},
    similarSlugs: mapSimilarSlugs(page.similar),
  };
}

export function mapCardPageToVariantPayload(page: EdhrecCardPage): CardVariantPayload {
  const card = page.container.json_dict.card;

  return {
    name: card.name,
    salt: card.salt ?? null,
    numDecks: card.num_decks ?? null,
    inclusion: card.inclusion ?? null,
    potentialDecks: card.potential_decks ?? null,
    cardlists: page.container.json_dict.cardlists ?? {},
    similarCards: page.similar ?? [],
  };
}
