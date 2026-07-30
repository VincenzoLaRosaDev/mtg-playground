import {
  inclusionRankChipLabel,
  INCLUSION_RANK_TITLE,
} from "@/lib/display/inclusion-rank";

type DetailHeroMetaProps = {
  popularityRank?: number | null;
  /** When false, omit inclusion chip. */
  showInclusionRank?: boolean;
  isGameChanger?: boolean;
  isReserved?: boolean;
  /** Legal as a commander (Scryfall catalog flag). */
  isCommander?: boolean;
};

export function DetailHeroMeta({
  popularityRank,
  showInclusionRank = true,
  isGameChanger,
  isReserved,
  isCommander,
}: DetailHeroMetaProps) {
  const chips: Array<{ label: string; title?: string }> = [];

  if (showInclusionRank && popularityRank != null) {
    chips.push({
      label: inclusionRankChipLabel(popularityRank),
      title: INCLUSION_RANK_TITLE,
    });
  }
  if (isCommander) {
    chips.push({
      label: "Legal commander",
      title: "This card can be your commander in the Commander format",
    });
  }
  if (isGameChanger) {
    chips.push({ label: "Game Changer", title: "Scryfall Game Changer flag" });
  }
  if (isReserved) {
    chips.push({ label: "Reserved List", title: "On the Reserved List" });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li
          key={chip.label}
          title={chip.title}
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium"
        >
          {chip.label}
        </li>
      ))}
    </ul>
  );
}
