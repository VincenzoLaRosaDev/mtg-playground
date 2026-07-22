import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import {
  CARD_TEXT_SEARCH_MIN_LENGTH,
  buildCardTextTsQueryExpression,
  sanitizeCardTextSearchQuery,
} from "@/lib/search/card-text-search";

export {
  CARD_TEXT_SEARCH_MIN_LENGTH,
  CARD_TEXT_SEARCH_PLACEHOLDER,
  buildCardSearchDocument,
  buildCardSearchDocumentFromScryfall,
  buildCardTextTsQueryExpression,
  countCardTextSearchTokens,
  escapeTsQueryLexeme,
  resolveCardTextTsQueryMode,
  sanitizeCardTextSearchQuery,
} from "@/lib/search/card-text-search";

type SearchIdRow = { id: string };

function prepareTsQueryExpression(query: string): string | null {
  const sanitized = sanitizeCardTextSearchQuery(query);
  if (sanitized.length < CARD_TEXT_SEARCH_MIN_LENGTH) {
    return null;
  }
  return buildCardTextTsQueryExpression(sanitized);
}

/**
 * Card ids matching weighted FTS (name A / type B / oracle C).
 * Uses `to_tsquery` with last-token prefix (and phrase adjacency for multi-word).
 * Empty array = no matches. null = query too short / empty after sanitize.
 *
 * Capped so browse never materializes unbounded IN lists (Neon compute).
 * Typeahead should prefer `listRankedCardIdsMatchingTextSearch`.
 */
export const CARD_TEXT_SEARCH_BROWSE_ID_CAP = 2000;

export async function listCardIdsMatchingTextSearch(
  prisma: PrismaClient,
  query: string,
  options?: { limit?: number },
): Promise<string[] | null> {
  const expression = prepareTsQueryExpression(query);
  if (!expression) return null;

  const limit = Math.min(
    Math.max(1, Math.floor(options?.limit ?? CARD_TEXT_SEARCH_BROWSE_ID_CAP)),
    CARD_TEXT_SEARCH_BROWSE_ID_CAP,
  );

  const rows = await prisma.$queryRaw<SearchIdRow[]>`
    SELECT id
    FROM cards
    WHERE search_tsv @@ to_tsquery('english', ${expression})
      AND layout <> 'art_series'
    ORDER BY
      ts_rank(search_tsv, to_tsquery('english', ${expression})) DESC,
      name ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => row.id);
}

/**
 * Ranked card ids for global search / typeahead (FTS rank, then name).
 * Same prefix/phrase expression as browse.
 */
export async function listRankedCardIdsMatchingTextSearch(
  prisma: PrismaClient,
  query: string,
  limit: number,
): Promise<string[] | null> {
  const expression = prepareTsQueryExpression(query);
  if (!expression) return null;

  const rows = await prisma.$queryRaw<SearchIdRow[]>`
    SELECT id
    FROM cards
    WHERE search_tsv @@ to_tsquery('english', ${expression})
      AND layout <> 'art_series'
    ORDER BY
      ts_rank(search_tsv, to_tsquery('english', ${expression})) DESC,
      name ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => row.id);
}

/** Prisma filter fragment for browse when FTS ids are resolved. */
export function cardIdsTextSearchWhere(ids: string[]): Prisma.CardWhereInput {
  if (ids.length === 0) {
    return { id: { in: ["__no_text_match__"] } };
  }
  return { id: { in: ids } };
}
