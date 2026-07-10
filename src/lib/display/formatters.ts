export function formatColorIdentity(colors: string[]): string {
  return colors.length > 0 ? colors.join("") : "Colorless";
}

export function formatRank(rank: number | null): string {
  return rank != null ? `#${rank}` : "—";
}
