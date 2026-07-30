import { isCommanderLikeFormat, type DeckBoard } from "@/lib/decks/boards";

export type ScryfallLegalityStatus =
  | "legal"
  | "not_legal"
  | "restricted"
  | "banned"
  | "unknown";

export type DeckLegalityIssueCode =
  | "banned"
  | "not_legal"
  | "restricted_copies"
  | "too_many_copies"
  | "main_size"
  | "side_size"
  | "commander_size"
  | "missing_commander"
  | "too_many_commanders"
  | "commander_illegal"
  | "color_identity"
  | "companion_count";

export type DeckLegalityIssue = {
  code: DeckLegalityIssueCode;
  message: string;
  /** When set, issue is about this oracle (may appear on multiple boards). */
  oracleId?: string;
  board?: DeckBoard;
};

export type DeckLegalityCardInput = {
  oracleId: string;
  quantity: number;
  board: DeckBoard;
  name: string;
  typeLine: string;
  colorIdentity: string[];
  isCommander: boolean;
  /** Raw Scryfall legalities JSON from `cards.legalities`. */
  legalities: unknown;
};

export type DeckLegalityResult = {
  ok: boolean;
  issues: DeckLegalityIssue[];
};

export type FormatDeckRules = {
  kind: "constructed" | "commander";
  /** Minimum main-board size (constructed). */
  mainMin: number | null;
  /**
   * Exact total for main + commander boards (commander-like).
   * Companion is outside this total.
   */
  deckExact: number | null;
  sideMax: number;
  /** Default max copies of a non-basic oracle across the whole deck. */
  maxCopies: number;
  requiresCommander: boolean;
  maxCommanders: number;
  enforceColorIdentity: boolean;
};

/** Detect Scryfall basic lands (exempt from singleton / 4-of). */
export function isBasicLandTypeLine(typeLine: string): boolean {
  const t = typeLine.toLowerCase();
  return t.includes("basic") && t.includes("land");
}

export function readFormatLegality(
  legalities: unknown,
  format: string,
): ScryfallLegalityStatus {
  if (!legalities || typeof legalities !== "object" || Array.isArray(legalities)) {
    return "unknown";
  }
  const value = (legalities as Record<string, unknown>)[format];
  if (value === "legal") return "legal";
  if (value === "not_legal") return "not_legal";
  if (value === "restricted") return "restricted";
  if (value === "banned") return "banned";
  return "unknown";
}

export function formatDeckRules(format: string): FormatDeckRules {
  if (isCommanderLikeFormat(format)) {
    const deckExact = format === "brawl" ? 60 : 100;
    const maxCommanders = format === "oathbreaker" ? 2 : 1;
    return {
      kind: "commander",
      mainMin: null,
      deckExact,
      sideMax: 0,
      maxCopies: 1,
      requiresCommander: true,
      maxCommanders,
      enforceColorIdentity: true,
    };
  }

  return {
    kind: "constructed",
    mainMin: 60,
    deckExact: null,
    sideMax: 15,
    maxCopies: 4,
    requiresCommander: false,
    maxCommanders: 0,
    enforceColorIdentity: false,
  };
}

/** Soft UI / input cap for qty fields (basics uncapped aside from deck size). */
export const BASIC_LAND_QTY_INPUT_MAX = 99;

/**
 * Max copies allowed for one oracle in this format (basics / restricted aware).
 * Used by qty inputs and import UX — mutations still enforce via `mutationBlockReason`.
 */
export function maxCopiesForCard(input: {
  format: string;
  typeLine: string;
  legalities: unknown;
}): number {
  if (isBasicLandTypeLine(input.typeLine)) return BASIC_LAND_QTY_INPUT_MAX;
  const status = readFormatLegality(input.legalities, input.format);
  if (status === "restricted") return 1;
  return formatDeckRules(input.format).maxCopies;
}

function sumBoard(
  cards: readonly DeckLegalityCardInput[],
  board: DeckBoard,
): number {
  return cards
    .filter((c) => c.board === board)
    .reduce((sum, c) => sum + c.quantity, 0);
}

function unionColorIdentity(cards: readonly DeckLegalityCardInput[]): string[] {
  const set = new Set<string>();
  for (const card of cards) {
    for (const color of card.colorIdentity) set.add(color);
  }
  return [...set];
}

function isSubsetCI(cardCI: string[], commanderCI: string[]): boolean {
  const allowed = new Set(commanderCI);
  return cardCI.every((c) => allowed.has(c));
}

/**
 * Evaluate a decklist for the given Scryfall format key.
 * All issues are blocking (severity deck is not “legal”); the editor may still
 * allow edits that reduce issues, while mutations refuse adds that introduce
 * card/copy/CI/commander-count violations.
 */
export function evaluateDeckLegality(
  format: string,
  cards: readonly DeckLegalityCardInput[],
): DeckLegalityResult {
  const rules = formatDeckRules(format);
  const issues: DeckLegalityIssue[] = [];

  const mainCount = sumBoard(cards, "main");
  const sideCount = sumBoard(cards, "side");
  const commanderCards = cards.filter((c) => c.board === "commander");
  const companionCards = cards.filter((c) => c.board === "companion");
  const commanderCount = commanderCards.reduce((s, c) => s + c.quantity, 0);
  const companionCount = companionCards.reduce((s, c) => s + c.quantity, 0);
  const deckCoreCount =
    mainCount + commanderCards.reduce((s, c) => s + c.quantity, 0);

  // Per-card format legality + copy limits (oracle across all boards)
  const qtyByOracle = new Map<
    string,
    { qty: number; name: string; typeLine: string; status: ScryfallLegalityStatus }
  >();

  for (const card of cards) {
    const status = readFormatLegality(card.legalities, format);
    const prev = qtyByOracle.get(card.oracleId);
    qtyByOracle.set(card.oracleId, {
      qty: (prev?.qty ?? 0) + card.quantity,
      name: card.name,
      typeLine: card.typeLine,
      status,
    });

    if (status === "banned") {
      issues.push({
        code: "banned",
        message: `${card.name} is banned in this format.`,
        oracleId: card.oracleId,
        board: card.board,
      });
    } else if (status === "not_legal" || status === "unknown") {
      issues.push({
        code: "not_legal",
        message: `${card.name} is not legal in this format.`,
        oracleId: card.oracleId,
        board: card.board,
      });
    }
  }

  for (const [oracleId, row] of qtyByOracle) {
    if (isBasicLandTypeLine(row.typeLine)) continue;
    const maxForCard = row.status === "restricted" ? 1 : rules.maxCopies;
    if (row.qty > maxForCard) {
      issues.push({
        code: row.status === "restricted" ? "restricted_copies" : "too_many_copies",
        message:
          row.status === "restricted"
            ? `${row.name} is restricted — at most 1 copy.`
            : `${row.name}: at most ${maxForCard} ${maxForCard === 1 ? "copy" : "copies"} in this format.`,
        oracleId,
      });
    }
  }

  if (rules.kind === "constructed") {
    if (cards.length > 0 && rules.mainMin != null && mainCount < rules.mainMin) {
      issues.push({
        code: "main_size",
        message: `Main deck needs at least ${rules.mainMin} cards (has ${mainCount}).`,
        board: "main",
      });
    }
    if (sideCount > rules.sideMax) {
      issues.push({
        code: "side_size",
        message: `Sideboard can have at most ${rules.sideMax} cards (has ${sideCount}).`,
        board: "side",
      });
    }
  }

  if (rules.kind === "commander") {
    if (sideCount > rules.sideMax) {
      issues.push({
        code: "side_size",
        message:
          rules.sideMax === 0
            ? "Commander-like formats do not use a sideboard in this builder."
            : `Sideboard can have at most ${rules.sideMax} cards (has ${sideCount}).`,
        board: "side",
      });
    }

    if (rules.requiresCommander && commanderCount < 1 && cards.length > 0) {
      issues.push({
        code: "missing_commander",
        message: "Add a commander for this format.",
        board: "commander",
      });
    }

    if (commanderCount > rules.maxCommanders) {
      issues.push({
        code: "too_many_commanders",
        message: `At most ${rules.maxCommanders} card${rules.maxCommanders === 1 ? "" : "s"} on the commander board.`,
        board: "commander",
      });
    }

    for (const card of commanderCards) {
      if (!card.isCommander) {
        issues.push({
          code: "commander_illegal",
          message: `${card.name} cannot be a commander.`,
          oracleId: card.oracleId,
          board: "commander",
        });
      }
    }

    if (
      rules.deckExact != null &&
      cards.length > 0 &&
      deckCoreCount !== rules.deckExact
    ) {
      issues.push({
        code: "commander_size",
        message: `Deck must be exactly ${rules.deckExact} cards including commander (has ${deckCoreCount}).`,
      });
    }

    if (rules.enforceColorIdentity && commanderCount >= 1) {
      const commanderCI = unionColorIdentity(commanderCards);
      for (const card of cards) {
        if (card.board === "commander") continue;
        if (!isSubsetCI(card.colorIdentity, commanderCI)) {
          issues.push({
            code: "color_identity",
            message: `${card.name} is outside the commander’s color identity.`,
            oracleId: card.oracleId,
            board: card.board,
          });
        }
      }
    }

    if (companionCount > 1) {
      issues.push({
        code: "companion_count",
        message: "At most one companion.",
        board: "companion",
      });
    }
  }

  // Dedupe identical messages (same card on multi rows for banned)
  const seen = new Set<string>();
  const deduped = issues.filter((issue) => {
    const key = `${issue.code}:${issue.oracleId ?? ""}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { ok: deduped.length === 0, issues: deduped };
}

/**
 * Whether adding `delta` copies of a card to `board` would introduce a
 * mutation-blocking issue (banned / copies / CI / commander count).
 * Size incompleteness alone does not block adds.
 */
export function mutationBlockReason(input: {
  format: string;
  existing: readonly DeckLegalityCardInput[];
  next: Omit<DeckLegalityCardInput, "quantity"> & { quantity: number };
}): string | null {
  const { format, existing, next } = input;
  const rules = formatDeckRules(format);
  const status = readFormatLegality(next.legalities, format);

  if (status === "banned") {
    return `${next.name} is banned in this format.`;
  }
  if (status === "not_legal" || status === "unknown") {
    return `${next.name} is not legal in this format.`;
  }

  if (next.board === "commander") {
    if (!next.isCommander) {
      return `${next.name} cannot be a commander.`;
    }
    const projectedCommanderQty =
      existing
        .filter((c) => c.board === "commander" && c.oracleId !== next.oracleId)
        .reduce((s, c) => s + c.quantity, 0) + next.quantity;
    if (projectedCommanderQty > rules.maxCommanders) {
      return `At most ${rules.maxCommanders} card${rules.maxCommanders === 1 ? "" : "s"} on the commander board.`;
    }
  }

  if (next.board === "companion") {
    const other = existing
      .filter((c) => c.board === "companion" && c.oracleId !== next.oracleId)
      .reduce((s, c) => s + c.quantity, 0);
    if (other + next.quantity > 1) {
      return "At most one companion.";
    }
  }

  if (next.board === "side" && rules.sideMax === 0) {
    return "This format does not use a sideboard in the builder.";
  }

  if (!isBasicLandTypeLine(next.typeLine)) {
    const otherQty = existing
      .filter((c) => c.oracleId === next.oracleId)
      .reduce((s, c) => s + c.quantity, 0);
    // Replace same board row qty rather than double-count when updating
    const sameBoard = existing.find(
      (c) => c.oracleId === next.oracleId && c.board === next.board,
    );
    const projected =
      otherQty - (sameBoard?.quantity ?? 0) + next.quantity;
    const maxForCard = status === "restricted" ? 1 : rules.maxCopies;
    if (projected > maxForCard) {
      return status === "restricted"
        ? `${next.name} is restricted — at most 1 copy.`
        : `At most ${maxForCard} ${maxForCard === 1 ? "copy" : "copies"} of ${next.name}.`;
    }
  }

  if (rules.enforceColorIdentity && next.board !== "commander") {
    const commanders = existing.filter((c) => c.board === "commander");
    if (commanders.length > 0) {
      const commanderCI = unionColorIdentity(commanders);
      if (!isSubsetCI(next.colorIdentity, commanderCI)) {
        return `${next.name} is outside the commander’s color identity.`;
      }
    }
  }

  if (rules.kind === "constructed" && next.board === "side") {
    const sideOther = existing
      .filter((c) => c.board === "side")
      .reduce((s, c) => s + c.quantity, 0);
    const same = existing.find(
      (c) => c.oracleId === next.oracleId && c.board === "side",
    );
    const projected = sideOther - (same?.quantity ?? 0) + next.quantity;
    if (projected > rules.sideMax) {
      return `Sideboard can have at most ${rules.sideMax} cards.`;
    }
  }

  return null;
}
