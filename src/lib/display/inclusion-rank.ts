/** Scryfall `edhrec_rank` — Commander deck inclusion, not “as commander” popularity. */

export const INCLUSION_RANK_SORT_LABEL = "EDH Inclusion";

export const INCLUSION_RANK_SHORT_LABEL = "EDH Inclusion";

export const INCLUSION_RANK_TITLE =
  "Commander (EDH) deck inclusion from Scryfall. Lower = more often in EDH decks — not how often chosen as commander.";

export function formatInclusionRank(rank: number | null | undefined): string | null {
  if (rank == null) return null;
  return `#${rank.toLocaleString()}`;
}

export function inclusionRankChipLabel(rank: number): string {
  return `EDH Inclusion ${formatInclusionRank(rank)}`;
}
