/**
 * Parse MTGA / Arena and plain-text decklists into oracle-name rows.
 *
 * Supported:
 * - Arena: optional `About` / `Name …` metadata, then `Deck` / `Sideboard` /
 *   `Commander` / `Companion` sections with `4 Lightning Bolt (M10) 146`
 * - Plain: `1 Sol Ring` or `Sol Ring` (qty defaults to 1)
 * - EDHREC / MTGGoldfish style name lists; if no section headers appear, a
 *   blank line after main-deck cards starts the sideboard
 *
 * Set codes and collector numbers are stripped for oracle resolve (import is oracle-grain).
 */

import type { DeckBoard } from "@/lib/decks/boards";

export type DeckPasteLine = {
  lineNumber: number;
  raw: string;
  quantity: number;
  /** Face name as pasted (primary face; // backs stripped for lookup). */
  name: string;
  board: DeckBoard;
};

export type DeckPasteParseResult = {
  lines: DeckPasteLine[];
  errors: { lineNumber: number; raw: string; message: string }[];
  /** From Arena `About` → `Name …` when present. */
  deckName: string | null;
};

const SECTION_MAP: Record<string, DeckBoard | "skip"> = {
  about: "skip",
  deck: "main",
  main: "main",
  mainboard: "main",
  maindeck: "main",
  sideboard: "side",
  side: "side",
  commander: "commander",
  commanders: "commander",
  companion: "companion",
  maybeboard: "skip",
  maybe: "skip",
};

/** Headers that mean the list uses explicit boards (disable blank-line sideboard). */
const EXPLICIT_BOARD_HEADERS = new Set([
  "deck",
  "main",
  "mainboard",
  "maindeck",
  "sideboard",
  "side",
  "commander",
  "commanders",
  "companion",
]);

const ARENA_LINE =
  /^(\d+)\s+(.+?)(?:\s+\(([a-z0-9]{2,5})\)\s*[0-9a-z]*\s*)?$/i;

function normalizeSection(value: string): DeckBoard | "skip" | null {
  const key = value.trim().toLowerCase().replace(/:$/, "");
  return SECTION_MAP[key] ?? null;
}

function isExplicitBoardHeader(value: string): boolean {
  const key = value.trim().toLowerCase().replace(/:$/, "");
  return EXPLICIT_BOARD_HEADERS.has(key);
}

/** Arena `Name Dimir Tempo` metadata line. */
function parseArenaDeckName(line: string): string | null {
  const match = line.trim().match(/^name\s+(.+)$/i);
  const name = match?.[1]?.trim();
  return name || null;
}

/**
 * Strip Arena `(SET) cn` suffix and trim DFC ` // Back` for catalog lookup.
 */
export function normalizePastedCardName(name: string): string {
  let n = name.trim();
  // Arena trailing (SET) 123 — already handled in parse, but belt-and-suspenders
  n = n.replace(/\s*\([a-z0-9]{2,5}\)\s*[0-9a-z]*\s*$/i, "").trim();
  // Keep front face only for lookup (catalog search_name may be full DFC)
  const front = n.split(/\s*\/\/\s*/)[0]?.trim() ?? n;
  return front;
}

function parseCardLine(
  lineNumber: number,
  raw: string,
  board: DeckBoard,
): DeckPasteLine | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: "Empty line." };

  const arena = trimmed.match(ARENA_LINE);
  if (arena) {
    const quantity = Number.parseInt(arena[1]!, 10);
    const name = normalizePastedCardName(arena[2]!);
    if (!name) return { error: "Missing card name." };
    if (!Number.isFinite(quantity) || quantity < 1) {
      return { error: "Invalid quantity." };
    }
    return { lineNumber, raw, quantity, name, board };
  }

  // Plain: optional leading qty
  const plain = trimmed.match(/^(\d+)\s+(.+)$/);
  if (plain) {
    const quantity = Number.parseInt(plain[1]!, 10);
    const name = normalizePastedCardName(plain[2]!);
    if (!name) return { error: "Missing card name." };
    if (!Number.isFinite(quantity) || quantity < 1) {
      return { error: "Invalid quantity." };
    }
    return { lineNumber, raw, quantity, name, board };
  }

  const name = normalizePastedCardName(trimmed);
  if (!name) return { error: "Missing card name." };
  return { lineNumber, raw, quantity: 1, name, board };
}

export function parseDeckPaste(text: string): DeckPasteParseResult {
  const lines: DeckPasteLine[] = [];
  const errors: DeckPasteParseResult["errors"] = [];
  let board: DeckBoard | "skip" = "main";
  let usedExplicitBoardHeader = false;
  let deckName: string | null = null;
  /** True after at least one main-deck card when headers were never used. */
  let blankLineCanOpenSideboard = false;

  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  rawLines.forEach((raw, index) => {
    const lineNumber = index + 1;
    const trimmed = raw.trim();

    if (!trimmed) {
      // Plain lists (MTGGoldfish / MTGO style): first blank line after main
      // cards opens sideboard when no Deck/Sideboard headers were used.
      if (
        !usedExplicitBoardHeader &&
        blankLineCanOpenSideboard &&
        board === "main"
      ) {
        board = "side";
        blankLineCanOpenSideboard = false;
      }
      return;
    }

    if (trimmed.startsWith("#") || trimmed.startsWith("//")) return;

    const section = normalizeSection(trimmed);
    if (section) {
      if (isExplicitBoardHeader(trimmed)) {
        usedExplicitBoardHeader = true;
        blankLineCanOpenSideboard = false;
      }
      board = section;
      return;
    }

    if (board === "skip") {
      // Capture Arena deck title while skipping About metadata.
      const fromAbout = parseArenaDeckName(trimmed);
      if (fromAbout) deckName = fromAbout;
      return;
    }

    // `Name Foo` without a prior About header — treat as metadata, not a card.
    const orphanName = parseArenaDeckName(trimmed);
    if (orphanName && lines.length === 0) {
      deckName = orphanName;
      return;
    }

    const parsed = parseCardLine(lineNumber, trimmed, board);
    if ("error" in parsed) {
      errors.push({ lineNumber, raw: trimmed, message: parsed.error });
      return;
    }
    lines.push(parsed);
    if (
      !usedExplicitBoardHeader &&
      parsed.board === "main" &&
      board === "main"
    ) {
      blankLineCanOpenSideboard = true;
    }
  });

  return { lines, errors, deckName };
}
