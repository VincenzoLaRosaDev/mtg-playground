import { RankBadge } from "@/components/discovery/rank-badge";
import { SaltBadge } from "@/components/discovery/salt-badge";
import { COMMANDER_DETAIL_RANK_LABEL } from "@/lib/edhrec/commander-rank";

type DetailHeroBadgesProps = {
  rank?: number | null;
  salt?: number | null;
  className?: string;
  /** When true, rank tooltip notes all-time EDHREC profile rank (commander detail). */
  allTimeRank?: boolean;
};

export function DetailHeroBadges({
  rank,
  salt,
  className = "",
  allTimeRank = false,
}: DetailHeroBadgesProps) {
  if (rank == null && salt == null) {
    return null;
  }

  const rankTitle = allTimeRank ? `${COMMANDER_DETAIL_RANK_LABEL} EDHREC rank` : undefined;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {rank != null && <RankBadge rank={rank} title={rankTitle} />}
      {salt != null && <SaltBadge salt={salt} />}
    </div>
  );
}
