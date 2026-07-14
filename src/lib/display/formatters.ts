import { formatColorIdentityLabel } from "@/lib/mtg/mana-labels";

/** Plain-text color identity for titles, metadata, and screen-reader fallbacks. */
export function formatColorIdentity(colors: string[]): string {
  return formatColorIdentityLabel(colors);
}

export function formatRank(rank: number | null): string {
  return rank != null ? `#${rank}` : "—";
}

export function formatInclusionPercent(
  inclusion: number | null | undefined,
  potentialDecks: number | null | undefined,
  numDecks?: number | null,
): string {
  const numerator = inclusion ?? numDecks ?? null;

  if (numerator == null || potentialDecks == null || potentialDecks <= 0) {
    return "—";
  }

  return `${((numerator / potentialDecks) * 100).toFixed(1)}%`;
}

export function formatSynergyPercent(value: number | null): string {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}
