import type { EdhrecPageEntityType } from "@/generated/prisma/client";

import { bracketValueToSlug } from "@/lib/edhrec/filter-options";

export type EdhrecPageFilters = {
  theme?: string | null;
  budget?: string | null;
  bracket?: string | null;
};

export type NormalizedEdhrecPageFilters = {
  theme: string;
  budget: string;
  bracket: string;
};

export function normalizePageFilters(filters: EdhrecPageFilters = {}): NormalizedEdhrecPageFilters {
  return {
    theme: filters.theme?.trim() ?? "",
    budget: filters.budget?.trim() ?? "",
    bracket: filters.bracket?.trim() ?? "",
  };
}

export function hasActivePageFilters(filters: EdhrecPageFilters = {}): boolean {
  const normalized = normalizePageFilters(filters);
  return Boolean(normalized.theme || normalized.budget || normalized.bracket);
}

export function slugifyTheme(theme: string): string {
  return theme
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function commanderPathSegments(filters: NormalizedEdhrecPageFilters): string[] {
  const themeSlug = filters.theme ? slugifyTheme(filters.theme) : "";
  const budget = filters.budget || "";
  const bracketSlug = bracketValueToSlug(filters.bracket);

  if (bracketSlug && themeSlug && budget) {
    return [bracketSlug, themeSlug, budget];
  }

  if (bracketSlug && themeSlug) {
    return [bracketSlug, themeSlug];
  }

  if (bracketSlug && budget) {
    return [bracketSlug, budget];
  }

  if (themeSlug && budget) {
    return [themeSlug, budget];
  }

  if (bracketSlug) {
    return [bracketSlug];
  }

  if (themeSlug) {
    return [themeSlug];
  }

  if (budget) {
    return [budget];
  }

  return [];
}

/** Build json.edhrec.com/pages/… path segment for commander detail variants. */
export function buildCommanderPagePath(slug: string, filters: EdhrecPageFilters = {}): string {
  const normalized = normalizePageFilters(filters);
  const segments = commanderPathSegments(normalized);

  if (segments.length === 0) {
    return `commanders/${encodeURIComponent(slug)}.json`;
  }

  return `commanders/${encodeURIComponent(slug)}/${segments.join("/")}.json`;
}

/**
 * Card detail filters use query params on the default card page (spike 1.6.9b).
 */
export function buildCardPagePath(slug: string, filters: EdhrecPageFilters = {}): string {
  const normalized = normalizePageFilters(filters);
  const base = `cards/${encodeURIComponent(slug)}.json`;
  const params = new URLSearchParams();

  if (normalized.budget) {
    params.set("cost", normalized.budget);
  }

  if (normalized.theme) {
    params.set("theme", slugifyTheme(normalized.theme));
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function buildEdhrecPageUrl(
  entityType: EdhrecPageEntityType,
  slug: string,
  filters: EdhrecPageFilters = {},
): string {
  const path =
    entityType === "COMMANDER"
      ? buildCommanderPagePath(slug, filters)
      : buildCardPagePath(slug, filters);

  return `https://json.edhrec.com/pages/${path}`;
}
