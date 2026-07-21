/**
 * Curated Scryfall format keys for browse / future deck formats.
 * Status values on cards.legalities: legal | not_legal | restricted | banned.
 * Browse filter v1 matches status === "legal" only.
 */

export const SCRYFALL_BROWSE_FORMATS = [
  { value: "standard", label: "Standard" },
  { value: "pioneer", label: "Pioneer" },
  { value: "modern", label: "Modern" },
  { value: "legacy", label: "Legacy" },
  { value: "vintage", label: "Vintage" },
  { value: "pauper", label: "Pauper" },
  { value: "commander", label: "Commander" },
  { value: "historic", label: "Historic" },
  { value: "timeless", label: "Timeless" },
  { value: "alchemy", label: "Alchemy" },
  { value: "brawl", label: "Brawl" },
  { value: "duel", label: "Duel Commander" },
  { value: "oathbreaker", label: "Oathbreaker" },
  { value: "predh", label: "PreDH" },
] as const;

export type ScryfallBrowseFormat = (typeof SCRYFALL_BROWSE_FORMATS)[number]["value"];

const FORMAT_SET = new Set<string>(SCRYFALL_BROWSE_FORMATS.map((f) => f.value));

export function isScryfallBrowseFormat(value: string): value is ScryfallBrowseFormat {
  return FORMAT_SET.has(value);
}

/** Parse `format=` query param; empty / unknown → undefined. */
export function parseBrowseFormat(
  value: string | null | undefined,
): ScryfallBrowseFormat | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed || !isScryfallBrowseFormat(trimmed)) {
    return undefined;
  }
  return trimmed;
}

/**
 * Resolve format filter from URL params.
 * Prefer `format=`; legacy `commander=legal` maps to format=commander.
 */
export function resolveFormatFromSearchParams(params: {
  format?: string | null;
  commander?: string | null;
}): ScryfallBrowseFormat | undefined {
  const fromFormat = parseBrowseFormat(params.format ?? undefined);
  if (fromFormat) return fromFormat;
  if (params.commander === "legal") return "commander";
  return undefined;
}

export function getBrowseFormatFilterOptions(): Array<{
  value: ScryfallBrowseFormat;
  label: string;
}> {
  return SCRYFALL_BROWSE_FORMATS.map((f) => ({ value: f.value, label: f.label }));
}
