import type { PrismaClient } from "@/generated/prisma/client";

import type { DeckBoard } from "@/lib/decks/boards";
import {
  parseDeckPaste,
  type DeckPasteLine,
} from "@/lib/decks/paste-parse";
import { normalizeSearchName } from "@/lib/scryfall/card-utils";

export type ResolvedDeckPasteRow = {
  lineNumber: number;
  raw: string;
  quantity: number;
  board: DeckBoard;
  oracleId: string;
  name: string;
};

export type DeckPasteResolveResult = {
  rows: ResolvedDeckPasteRow[];
  parseErrors: { lineNumber: number; raw: string; message: string }[];
  resolveErrors: { lineNumber: number; raw: string; message: string }[];
  /** From Arena About → Name when present. */
  deckName: string | null;
};

/** Front-face search key — matches paste lookup and DFC `name // back` rows. */
export function frontFaceSearchKey(name: string): string {
  const front = name.split(/\s*\/\/\s*/)[0]?.trim() ?? name;
  return normalizeSearchName(front);
}

/**
 * Resolve pasted names to oracle ids.
 *
 * Matches:
 * - exact `search_name`
 * - DFC rows whose `search_name` / `name` starts with `front //`
 * - case-insensitive `name` (covers stale `search_name` that still has apostrophes)
 */
export async function resolveDeckPaste(
  prisma: PrismaClient,
  text: string,
): Promise<DeckPasteResolveResult> {
  const parsed = parseDeckPaste(text);
  const rows: ResolvedDeckPasteRow[] = [];
  const resolveErrors: DeckPasteResolveResult["resolveErrors"] = [];

  if (parsed.lines.length === 0) {
    return {
      rows,
      parseErrors: parsed.errors,
      resolveErrors,
      deckName: parsed.deckName,
    };
  }

  const uniqueKeys = [
    ...new Set(parsed.lines.map((line) => frontFaceSearchKey(line.name))),
  ].filter(Boolean);
  const displayNames = [
    ...new Set(parsed.lines.map((line) => line.name.trim()).filter(Boolean)),
  ];

  const orClauses = [
    ...uniqueKeys.flatMap((key) => [
      { searchName: key },
      { searchName: { startsWith: `${key} //` } },
    ]),
    ...displayNames.flatMap((name) => [
      { name: { equals: name, mode: "insensitive" as const } },
      { name: { startsWith: `${name} //`, mode: "insensitive" as const } },
    ]),
  ];

  const cards =
    orClauses.length > 0
      ? await prisma.card.findMany({
          where: { OR: orClauses },
          select: {
            oracleId: true,
            name: true,
            searchName: true,
          },
        })
      : [];

  const bySearch = new Map<string, typeof cards>();
  for (const card of cards) {
    const key = frontFaceSearchKey(card.name);
    const list = bySearch.get(key) ?? [];
    list.push(card);
    bySearch.set(key, list);
  }

  for (const line of parsed.lines) {
    const hit = resolveLine(line, bySearch);
    if ("error" in hit) {
      resolveErrors.push({
        lineNumber: line.lineNumber,
        raw: line.raw,
        message: hit.error,
      });
      continue;
    }
    rows.push(hit);
  }

  return {
    rows,
    parseErrors: parsed.errors,
    resolveErrors,
    deckName: parsed.deckName,
  };
}

function resolveLine(
  line: DeckPasteLine,
  bySearch: Map<
    string,
    { oracleId: string; name: string; searchName: string }[]
  >,
): ResolvedDeckPasteRow | { error: string } {
  const key = frontFaceSearchKey(line.name);
  const matches = bySearch.get(key) ?? [];
  if (matches.length === 0) {
    return { error: `Card not found: ${line.name}` };
  }
  if (matches.length > 1) {
    // Prefer exact display-name match ignoring case (front face or full DFC)
    const needle = line.name.toLowerCase();
    const exact = matches.filter((m) => {
      const front = m.name.split(/\s*\/\/\s*/)[0]?.trim().toLowerCase() ?? "";
      return m.name.toLowerCase() === needle || front === needle;
    });
    if (exact.length === 1) {
      return {
        lineNumber: line.lineNumber,
        raw: line.raw,
        quantity: line.quantity,
        board: line.board,
        oracleId: exact[0]!.oracleId,
        name: exact[0]!.name,
      };
    }
    // Deduplicate same oracleId (unlikely but cheap)
    const uniqueOracles = [...new Set(matches.map((m) => m.oracleId))];
    if (uniqueOracles.length === 1) {
      const card = matches[0]!;
      return {
        lineNumber: line.lineNumber,
        raw: line.raw,
        quantity: line.quantity,
        board: line.board,
        oracleId: card.oracleId,
        name: card.name,
      };
    }
    return {
      error: `Ambiguous name “${line.name}” (${matches.length} matches).`,
    };
  }
  const card = matches[0]!;
  return {
    lineNumber: line.lineNumber,
    raw: line.raw,
    quantity: line.quantity,
    board: line.board,
    oracleId: card.oracleId,
    name: card.name,
  };
}
