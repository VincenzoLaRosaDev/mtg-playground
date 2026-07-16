/**
 * Commander rank shown on detail page heroes and similar-commander tiles.
 *
 * Source: `edhrec_commander_profiles.rank` — synced from EDHREC's default commander
 * page JSON (`/pages/commanders/{slug}.json`), with no time-window parameter.
 * This is EDHREC's overall / all-time popularity rank, not the browse top-index rank
 * (`edhrec_top_entries`, which is windowed: week | month | year | all).
 * UI label is simply “Rank” (not “All-time Rank”).
 */
export const COMMANDER_DETAIL_RANK_LABEL = "All-time";

export type CommanderProfileRankFields = {
  rank: number | null;
};

export function commanderAllTimeRank(
  profile: CommanderProfileRankFields | null | undefined,
): number | null {
  return profile?.rank ?? null;
}
