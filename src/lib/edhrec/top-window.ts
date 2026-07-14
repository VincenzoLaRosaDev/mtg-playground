export const EDHREC_TOP_WINDOW_VALUES = [
  "week",
  "month",
  "year",
  "all",
] as const;

export type EdhrecTopWindowParam = (typeof EDHREC_TOP_WINDOW_VALUES)[number];

/** Card top browse: EDHREC publishes top JSON for week/month/year only (no all-time list). */
export const EDHREC_CARD_TOP_WINDOW_VALUES = ["week", "month", "year"] as const;

export type EdhrecCardTopWindowParam = (typeof EDHREC_CARD_TOP_WINDOW_VALUES)[number];

export const DEFAULT_EDHREC_TOP_WINDOW: EdhrecTopWindowParam = "year";

export const DEFAULT_EDHREC_CARD_TOP_WINDOW: EdhrecCardTopWindowParam = "year";

export function parseEdhrecTopWindowParam(
  value: string | null | undefined,
): EdhrecTopWindowParam {
  if (value === "week" || value === "month" || value === "year" || value === "all") {
    return value;
  }

  return DEFAULT_EDHREC_TOP_WINDOW;
}

const TOP_WINDOW_LABELS: Record<EdhrecTopWindowParam, string> = {
  week: "Past week",
  month: "Past month",
  year: "Past 2 years",
  all: "All time",
};

export const EDHREC_CARD_TOP_WINDOW_OPTIONS: { value: EdhrecCardTopWindowParam; label: string }[] =
  EDHREC_CARD_TOP_WINDOW_VALUES.map((value) => ({
    value,
    label: TOP_WINDOW_LABELS[value],
  }));

export const EDHREC_TOP_WINDOW_OPTIONS: { value: EdhrecTopWindowParam; label: string }[] =
  EDHREC_TOP_WINDOW_VALUES.map((value) => ({
    value,
    label: TOP_WINDOW_LABELS[value],
  }));

export function parseCardTopWindowParam(value: string | null | undefined): EdhrecCardTopWindowParam {
  if (value === "all") {
    throw new Error(
      'window=all is not supported for card top browse. Use week, month, or year (EDHREC has no all-time top list for cards).',
    );
  }

  if (value === "week" || value === "month" || value === "year") {
    return value;
  }

  return DEFAULT_EDHREC_CARD_TOP_WINDOW;
}
