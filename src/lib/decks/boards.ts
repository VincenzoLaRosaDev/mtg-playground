export const DECK_BOARDS = ["main", "side", "commander", "companion"] as const;

export type DeckBoard = (typeof DECK_BOARDS)[number];

const BOARD_SET = new Set<string>(DECK_BOARDS);

export function isDeckBoard(value: string): value is DeckBoard {
  return BOARD_SET.has(value);
}

export function parseDeckBoard(
  value: string | null | undefined,
): DeckBoard | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed || !isDeckBoard(trimmed)) return undefined;
  return trimmed;
}

/** Formats that show commander / companion boards in the editor. */
export const COMMANDER_LIKE_FORMATS = new Set([
  "commander",
  "duel",
  "oathbreaker",
  "brawl",
  "predh",
]);

export function isCommanderLikeFormat(format: string): boolean {
  return COMMANDER_LIKE_FORMATS.has(format);
}

export function boardLabel(board: DeckBoard): string {
  switch (board) {
    case "main":
      return "Main";
    case "side":
      return "Sideboard";
    case "commander":
      return "Commander";
    case "companion":
      return "Companion";
  }
}

export type DeckBoardQuantities = {
  main: number;
  side: number;
  commander: number;
  companion: number;
};

/** Sum copies per board from deck rows. */
export function sumDeckBoardQuantities(
  cards: readonly { board: string; quantity: number }[],
): DeckBoardQuantities {
  const counts: DeckBoardQuantities = {
    main: 0,
    side: 0,
    commander: 0,
    companion: 0,
  };
  for (const row of cards) {
    if (isDeckBoard(row.board)) {
      counts[row.board] += row.quantity;
    }
  }
  return counts;
}

/**
 * Listing / editor size line: always `N M · S S` (main · side), never a combined total.
 * Commander + companion count with main (deck “primary” size).
 */
export function formatDeckSizeLabel(counts: DeckBoardQuantities): string {
  const primary = counts.main + counts.commander + counts.companion;
  return `${primary} M · ${counts.side} S`;
}
