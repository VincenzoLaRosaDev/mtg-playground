/** EDHREC bracket level (1–5) → JSON path segment (spike 1.6.9). */
export const COMMANDER_BRACKET_OPTIONS = [
  { value: "1", label: "Bracket 1 — Exhibition", slug: "exhibition" },
  { value: "2", label: "Bracket 2 — Core", slug: "core" },
  { value: "3", label: "Bracket 3 — Upgraded", slug: "upgraded" },
  { value: "4", label: "Bracket 4 — Optimized", slug: "optimized" },
  { value: "5", label: "Bracket 5 — cEDH", slug: "cedh" },
] as const;

export type CommanderBracketValue = (typeof COMMANDER_BRACKET_OPTIONS)[number]["value"];

/** EDHREC commander JSON supports path segments `budget` and `expensive` only (`middle` → 403). */
export const COMMANDER_BUDGET_OPTIONS = [
  { value: "budget", label: "Budget" },
  { value: "expensive", label: "Expensive" },
] as const;

export type CommanderBudgetValue = (typeof COMMANDER_BUDGET_OPTIONS)[number]["value"];

const BRACKET_SLUG_BY_VALUE = new Map(
  COMMANDER_BRACKET_OPTIONS.map((option) => [option.value, option.slug]),
);

const BRACKET_VALUE_BY_SLUG = new Map<string, string>(
  COMMANDER_BRACKET_OPTIONS.map((option) => [option.slug, option.value]),
);

export function bracketValueToSlug(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  return BRACKET_SLUG_BY_VALUE.get(value.trim() as CommanderBracketValue) ?? null;
}

export function bracketSlugToValue(slug: string): string {
  return BRACKET_VALUE_BY_SLUG.get(slug) ?? "";
}

export function parseBudgetFilterParam(value: string | null | undefined): string {
  const normalized = value?.trim() ?? "";
  if (
    normalized === "budget" ||
    normalized === "middle" ||
    normalized === "expensive"
  ) {
    return normalized;
  }

  return "";
}

export function parseBracketFilterParam(value: string | null | undefined): string {
  const normalized = value?.trim() ?? "";
  return BRACKET_SLUG_BY_VALUE.has(normalized as CommanderBracketValue) ? normalized : "";
}

export function parseThemeFilterParam(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function isUnsupportedCommanderBudget(budget: string | null | undefined): boolean {
  return budget?.trim() === "middle";
}

export function getUnsupportedCommanderFilterMessage(filters: {
  theme?: string | null;
  budget?: string | null;
  bracket?: string | null;
}): string | null {
  if (isUnsupportedCommanderBudget(filters.budget)) {
    return "Mid budget is not available from EDHREC for commander pages. Use Budget or Expensive, or clear the filter.";
  }

  return null;
}
