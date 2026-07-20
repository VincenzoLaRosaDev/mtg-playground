/** Scryfall `edhrec_rank` — Commander deck inclusion, not “as commander” popularity. */

export const INCLUSION_RANK_SORT_LABEL = "Inclusion";

export const INCLUSION_RANK_SHORT_LABEL = "Inclusion";

export const INCLUSION_RANK_TITLE =
  "Scryfall Commander deck inclusion rank. Lower = more often included in decks — not how often the card is chosen as commander.";

export function formatInclusionRank(rank: number | null | undefined): string | null {
  if (rank == null) return null;
  return `#${rank.toLocaleString()}`;
}

export function inclusionRankChipLabel(rank: number): string {
  return `Inclusion ${formatInclusionRank(rank)}`;
}
