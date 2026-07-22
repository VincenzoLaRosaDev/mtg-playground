import { normalizeSearchName } from "@/lib/scryfall/card-utils";
import { parseCardFaces } from "@/lib/scryfall/faces";

export const CARD_TEXT_SEARCH_MIN_LENGTH = 2;

export const CARD_TEXT_SEARCH_PLACEHOLDER = "Search name, type, or text…";

type SearchDocumentInput = {
  name: string;
  typeLine: string;
  oracleText?: string | null;
  /** Scryfall faces JSON or mapped face list — used for DFC/MDFC oracle text. */
  faces?: unknown;
};

/**
 * Oracle-side corpus for FTS weight C (name/type use live columns for A/B).
 * Includes top-level oracle text plus each face's name / type / oracle text.
 */
export function buildCardSearchDocument(input: SearchDocumentInput): string {
  const parts: string[] = [];

  if (input.oracleText?.trim()) {
    parts.push(input.oracleText.trim());
  }

  const faces = parseCardFaces(input.faces);
  for (const face of faces) {
    if (face.name?.trim() && face.name !== input.name) {
      parts.push(face.name.trim());
    }
    if (face.typeLine?.trim() && face.typeLine !== input.typeLine) {
      parts.push(face.typeLine.trim());
    }
    if (face.oracleText?.trim()) {
      parts.push(face.oracleText.trim());
    }
  }

  // Keep a normalized blob for debugging / future ILIKE; accents stripped.
  return normalizeSearchName(parts.join("\n"));
}

/** Build from Scryfall-shaped card during sync (before faces are mapped to JSON). */
export function buildCardSearchDocumentFromScryfall(card: {
  name: string;
  type_line: string;
  oracle_text?: string | null;
  card_faces?: Array<{
    name?: string;
    type_line?: string | null;
    oracle_text?: string | null;
  }> | null;
}): string {
  const parts: string[] = [];

  if (card.oracle_text?.trim()) {
    parts.push(card.oracle_text.trim());
  }

  for (const face of card.card_faces ?? []) {
    if (face.name?.trim() && face.name !== card.name) {
      parts.push(face.name.trim());
    }
    if (face.type_line?.trim() && face.type_line !== card.type_line) {
      parts.push(face.type_line.trim());
    }
    if (face.oracle_text?.trim()) {
      parts.push(face.oracle_text.trim());
    }
  }

  return normalizeSearchName(parts.join("\n"));
}

/**
 * Sanitize user query — strip odd punctuation, keep letters/digits.
 * Returns empty string when nothing searchable remains.
 */
export function sanitizeCardTextSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[''`´’]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whitespace-separated tokens after sanitize (empty tokens dropped). */
export function countCardTextSearchTokens(sanitizedQuery: string): number {
  if (!sanitizedQuery) return 0;
  return sanitizedQuery.split(/\s+/).filter(Boolean).length;
}

/**
 * Strip characters that are special in `to_tsquery` lexemes.
 * Returns empty string if nothing usable remains.
 */
export function escapeTsQueryLexeme(token: string): string {
  return token.replace(/[&|!:*()<>'\\]/g, "").trim();
}

/**
 * Build a `to_tsquery('english', …)` expression:
 * - 1 token → `token:*` (prefix — “judgmen” matches Judgment)
 * - ≥2 tokens → `t1 <-> t2 <-> … <-> tN:*` (phrase; last token is prefix —
 *   “destroy all creatu” matches “Destroy all creatures”)
 *
 * Complete words still match via prefix of the full stem (`creature:*` → creatur).
 * Returns null when no valid lexemes remain.
 */
export function buildCardTextTsQueryExpression(sanitizedQuery: string): string | null {
  const rawTokens = sanitizedQuery.split(/\s+/).filter(Boolean);
  const tokens = rawTokens.map(escapeTsQueryLexeme).filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return null;
  }

  if (tokens.length === 1) {
    return `${tokens[0]}:*`;
  }

  const head = tokens.slice(0, -1);
  const last = tokens[tokens.length - 1]!;
  return `${head.join(" <-> ")} <-> ${last}:*`;
}

/** @deprecated Prefer buildCardTextTsQueryExpression — kept for call-site clarity in tests. */
export type CardTextTsQueryMode = "prefix" | "phrase_prefix";

export function resolveCardTextTsQueryMode(sanitizedQuery: string): CardTextTsQueryMode {
  return countCardTextSearchTokens(sanitizedQuery) >= 2 ? "phrase_prefix" : "prefix";
}
