/**
 * In-builder deck insights (Phase 2.2.6): roles / themes / GC.
 * Counts copies on main + commander boards (side / companion excluded).
 */

import {
  BUILD_SKELETON_TARGETS,
} from "@/lib/discovery/detail-pack";
import type { DeckBoard } from "@/lib/decks/boards";

const COUNTED_BOARDS = new Set<DeckBoard>(["main", "commander"]);

export type DeckInsightCardInput = {
  oracleId: string;
  quantity: number;
  board: DeckBoard;
  isGameChanger: boolean;
};

export type DeckInsightClassification = {
  roles: string[];
  themes: string[];
};

export type DeckInsightCount = {
  key: string;
  label: string;
  count: number;
};

export type DeckSkeletonProgress = {
  key: string;
  label: string;
  target: number;
  inDeck: number;
};

export type DeckInsights = {
  countedCopies: number;
  gameChangerCount: number;
  roleCounts: DeckInsightCount[];
  themeCounts: DeckInsightCount[];
  /** Present only when `includeSkeleton` — commander-like build targets. */
  skeleton: DeckSkeletonProgress[] | null;
};

function facetLabel(key: string): string {
  return key.replaceAll("_", " ");
}

function isCountedBoard(board: DeckBoard): boolean {
  return COUNTED_BOARDS.has(board);
}

/**
 * Aggregate classification + Card flags for the open deck.
 * `classificationsByOracle` may omit unclassified cards (treated as empty).
 */
export function summarizeDeckInsights(
  cards: readonly DeckInsightCardInput[],
  classificationsByOracle:
    | Map<string, DeckInsightClassification>
    | Record<string, DeckInsightClassification>,
  options?: { includeSkeleton?: boolean },
): DeckInsights {
  const classifications =
    classificationsByOracle instanceof Map
      ? classificationsByOracle
      : new Map(Object.entries(classificationsByOracle));

  let countedCopies = 0;
  let gameChangerCount = 0;
  const roleMap = new Map<string, number>();
  const themeMap = new Map<string, number>();

  for (const card of cards) {
    if (!isCountedBoard(card.board)) continue;
    const qty = card.quantity;
    if (qty < 1) continue;

    countedCopies += qty;
    if (card.isGameChanger) gameChangerCount += qty;

    const cls = classifications.get(card.oracleId);
    if (cls) {
      for (const role of cls.roles) {
        roleMap.set(role, (roleMap.get(role) ?? 0) + qty);
      }
      for (const theme of cls.themes) {
        themeMap.set(theme, (themeMap.get(theme) ?? 0) + qty);
      }
    }
  }

  const roleCounts = [...roleMap.entries()]
    .map(([key, count]) => ({ key, label: facetLabel(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const themeCounts = [...themeMap.entries()]
    .map(([key, count]) => ({ key, label: facetLabel(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  let skeleton: DeckSkeletonProgress[] | null = null;
  if (options?.includeSkeleton) {
    skeleton = BUILD_SKELETON_TARGETS.map((target) => {
      const inDeck = target.roles.reduce(
        (sum, role) => sum + (roleMap.get(role) ?? 0),
        0,
      );
      return {
        key: target.key,
        label: target.label,
        target: target.target,
        inDeck,
      };
    });
  }

  return {
    countedCopies,
    gameChangerCount,
    roleCounts,
    themeCounts,
    skeleton,
  };
}
