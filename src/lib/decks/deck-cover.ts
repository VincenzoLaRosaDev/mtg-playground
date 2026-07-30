/**
 * Cover face for private deck list cards.
 * Commander → highest-CMC non-land main → first main.
 */

import { isDeckBoard, type DeckBoard } from "@/lib/decks/boards";
import { primaryTypeGroupId } from "@/lib/decks/card-type-groups";

export type DeckCoverCardInput = {
  board: string;
  name: string;
  typeLine: string;
  cmc: number;
  imageUri: string | null;
};

export type DeckCover = {
  name: string;
  imageUri: string | null;
};

function byName(a: DeckCoverCardInput, b: DeckCoverCardInput): number {
  return a.name.localeCompare(b.name);
}

function onBoard(
  cards: readonly DeckCoverCardInput[],
  board: DeckBoard,
): DeckCoverCardInput[] {
  return cards.filter((c) => isDeckBoard(c.board) && c.board === board);
}

/**
 * Pick list-card cover art for a deck.
 * Prefers preferred-printing image already resolved on each input.
 */
export function pickDeckCover(
  cards: readonly DeckCoverCardInput[],
): DeckCover | null {
  const commanders = onBoard(cards, "commander").slice().sort(byName);
  if (commanders[0]) {
    return { name: commanders[0].name, imageUri: commanders[0].imageUri };
  }

  const main = onBoard(cards, "main");
  if (main.length === 0) return null;

  const nonLands = main.filter(
    (c) => primaryTypeGroupId(c.typeLine) !== "land",
  );
  if (nonLands.length > 0) {
    const best = nonLands.slice().sort((a, b) => {
      if (b.cmc !== a.cmc) return b.cmc - a.cmc;
      return byName(a, b);
    })[0]!;
    return { name: best.name, imageUri: best.imageUri };
  }

  const first = main.slice().sort(byName)[0]!;
  return { name: first.name, imageUri: first.imageUri };
}
