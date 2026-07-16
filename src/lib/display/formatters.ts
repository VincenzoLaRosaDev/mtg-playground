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

/** Compact counts for preview footers (e.g. 2400 → 2.4k, 7_400_000 → 7.4M). */
export function formatCompactCount(value: number): string {
  const abs = Math.abs(value);

  if (!Number.isFinite(value)) {
    return "—";
  }

  if (abs < 1000) {
    return value.toLocaleString("en-US");
  }

  const formatScaled = (scaled: number, suffix: string) => {
    const fixed = scaled.toFixed(1);
    const trimmed = fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
    return `${trimmed}${suffix}`;
  };

  if (abs < 1_000_000) {
    return formatScaled(value / 1000, "k");
  }

  if (abs < 1_000_000_000) {
    return formatScaled(value / 1_000_000, "M");
  }

  return formatScaled(value / 1_000_000_000, "B");
}
