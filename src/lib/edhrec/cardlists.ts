import type { EdhrecCardList, EdhrecCardView } from "@/lib/edhrec/types";

export function getTopCommandersFromCardlists(
  cardlists: Record<string, EdhrecCardList>,
): EdhrecCardView[] {
  for (const list of Object.values(cardlists)) {
    if (list.tag === "topcommanders" || list.header === "Top Commanders") {
      return list.cardviews ?? [];
    }
  }

  return [];
}

export function getTopCardsFromCommanderCardlists(
  cardlists: Record<string, EdhrecCardList>,
): EdhrecCardView[] {
  const preferredTags = ["highsynergycards", "topcards"];

  for (const tag of preferredTags) {
    for (const list of Object.values(cardlists)) {
      if (list.tag === tag) {
        return list.cardviews ?? [];
      }
    }
  }

  for (const list of Object.values(cardlists)) {
    if (list.header === "High Synergy Cards" || list.header === "Top Cards") {
      return list.cardviews ?? [];
    }
  }

  return [];
}

export function getTopThemes(
  tagCounts: Record<string, number>,
  limit = 10,
): { name: string; count: number }[] {
  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function formatInclusionPercent(inclusion: number, potentialDecks: number): string {
  if (potentialDecks <= 0) {
    return "—";
  }

  return `${((inclusion / potentialDecks) * 100).toFixed(1)}%`;
}
