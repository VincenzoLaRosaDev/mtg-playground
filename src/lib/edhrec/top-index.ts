import type { EdhrecTopEntityType } from "@/generated/prisma/client";
import { EdhrecTopEntityType as EdhrecTopEntityTypeEnum } from "@/generated/prisma/client";

import { fetchJson } from "@/lib/edhrec/client";
import type { EdhrecCardView, EdhrecListEntry } from "@/lib/edhrec/types";
import type { EdhrecTopWindowParam } from "@/lib/edhrec/top-window";

type TopCardlist = {
  cardviews?: EdhrecCardView[];
  more?: string | null;
};

type TopPagePayload = {
  container?: {
    json_dict?: {
      cardlists?: Record<string, TopCardlist>;
    };
  };
};

type TopMorePagePayload = {
  cardviews?: EdhrecCardView[];
  more?: string | null;
  is_paginated?: boolean;
};

type TopListPagePayload = TopPagePayload | TopMorePagePayload;

export type ParsedTopEntry = {
  slug: string;
  name: string;
  rank: number;
  numDecks: number | null;
  inclusion: number | null;
  potentialDecks: number | null;
};

export type FetchTopEntriesOptions = {
  /** Stop after this many unique entries (omit = full EDHREC chain). */
  maxEntries?: number;
  onProgress?: (progress: { page: number; entries: number; path: string }) => void;
};

const PAGE_DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTopMorePagePayload(payload: TopListPagePayload): payload is TopMorePagePayload {
  return "cardviews" in payload && Array.isArray(payload.cardviews);
}

function extractListSlice(payload: TopListPagePayload): {
  cardviews: EdhrecCardView[];
  more: string | null;
} | null {
  if (!isTopMorePagePayload(payload)) {
    const cardlists = payload.container?.json_dict?.cardlists;
    if (cardlists) {
      const first = Object.values(cardlists)[0];
      if (!first?.cardviews?.length) {
        return null;
      }

      return {
        cardviews: first.cardviews,
        more: first.more ?? null,
      };
    }

    return null;
  }

  if (!payload.cardviews?.length) {
    return null;
  }

  return {
    cardviews: payload.cardviews,
    more: payload.more ?? null,
  };
}

function cardTopBasePath(window: EdhrecTopWindowParam): string {
  return `top/${window}`;
}

function commanderTopBasePath(window: EdhrecTopWindowParam): string {
  return `commanders/${window}`;
}

async function fetchTopPage(relativePath: string): Promise<TopListPagePayload | null> {
  return fetchJson<TopListPagePayload>(`https://json.edhrec.com/pages/${relativePath}`);
}

function viewToEntry(view: EdhrecCardView, rank: number): ParsedTopEntry | null {
  if (!view.sanitized) {
    return null;
  }

  return {
    slug: view.sanitized,
    name: view.name,
    rank,
    numDecks: view.num_decks ?? null,
    inclusion: view.inclusion ?? null,
    potentialDecks: view.potential_decks ?? null,
  };
}

/**
 * Walk EDHREC top list pages: initial `{base}.json`, then each `list.more` path
 * (e.g. `top/year-past2years-1.json`). Legacy `--N.json` pagination returns 403.
 */
async function fetchPaginatedTop(
  basePath: string,
  options?: FetchTopEntriesOptions,
): Promise<ParsedTopEntry[]> {
  const merged: ParsedTopEntry[] = [];
  const seen = new Set<string>();
  let relativePath: string | null = `${basePath}.json`;
  let page = 0;

  while (relativePath) {
    const payload = await fetchTopPage(relativePath);
    if (!payload) {
      break;
    }

    const slice = extractListSlice(payload);
    if (!slice || slice.cardviews.length === 0) {
      break;
    }

    for (const view of slice.cardviews) {
      if (!view.sanitized || seen.has(view.sanitized)) {
        continue;
      }

      seen.add(view.sanitized);
      const rank = view.rank ?? merged.length + 1;
      const entry = viewToEntry(view, rank);
      if (entry) {
        merged.push(entry);
      }

      if (options?.maxEntries != null && merged.length >= options.maxEntries) {
        return merged.slice(0, options.maxEntries);
      }
    }

    options?.onProgress?.({ page, entries: merged.length, path: relativePath });

    relativePath = slice.more;
    page += 1;

    if (relativePath) {
      await sleep(PAGE_DELAY_MS);
    }
  }

  return merged;
}

export async function fetchCardTopEntries(
  window: EdhrecTopWindowParam,
  options?: FetchTopEntriesOptions,
): Promise<ParsedTopEntry[]> {
  if (window === "all") {
    return [];
  }

  return fetchPaginatedTop(cardTopBasePath(window), options);
}

export async function fetchCommanderTopEntries(
  window: EdhrecTopWindowParam,
  options?: FetchTopEntriesOptions,
): Promise<ParsedTopEntry[]> {
  if (window === "all") {
    return [];
  }

  return fetchPaginatedTop(commanderTopBasePath(window), options);
}

/** @deprecated Prefer fetchCardTopEntries — kept for HOT seed discovery fallback */
export async function fetchTopCardsListEntries(maxCount: number): Promise<EdhrecListEntry[]> {
  const entries = await fetchCardTopEntries("year", { maxEntries: maxCount });
  return entries.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    rank: entry.rank,
  }));
}

/** @deprecated Prefer fetchCommanderTopEntries — kept for HOT seed discovery fallback */
export async function fetchTopCommandersListEntries(maxCount: number): Promise<EdhrecListEntry[]> {
  const entries = await fetchCommanderTopEntries("year", { maxEntries: maxCount });
  return entries.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    rank: entry.rank,
  }));
}

export function topEntityTypeLabel(entityType: EdhrecTopEntityType): "card" | "commander" {
  return entityType === EdhrecTopEntityTypeEnum.COMMANDER ? "commander" : "card";
}

// Exported for unit tests
export const topIndexInternals = {
  extractListSlice,
};
