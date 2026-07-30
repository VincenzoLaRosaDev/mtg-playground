/**
 * Shared deck/precon stats bundle for DeckInsightsPanel (editor + precon PDP).
 */

import {
  mainBoardCopies,
  summarizeDeckCoherence,
  type CoherenceAlert,
} from "@/lib/decks/coherence";
import {
  summarizeDeckComposition,
  type DeckComposition,
} from "@/lib/decks/composition";
import {
  summarizeDeckCurveBreakdowns,
  type DeckCurveBreakdowns,
} from "@/lib/decks/curve-breakdowns";
import {
  summarizeDeckEstCost,
  type DeckEstCost,
  type DeckEstCostCardInput,
} from "@/lib/decks/est-cost";
import {
  summarizeDeckInsights,
  type DeckInsightCardInput,
  type DeckInsightClassification,
  type DeckInsights,
} from "@/lib/decks/insights";
import {
  summarizeDeckManaPips,
  type DeckManaPipCardInput,
  type DeckManaPips,
} from "@/lib/decks/mana-pips";
import {
  summarizeDeckManaProduction,
  type DeckManaProduction,
  type DeckManaProductionCardInput,
} from "@/lib/decks/mana-production";
import { summarizeDeckCardNameQuantities } from "@/lib/decks/odds-rows";
import {
  summarizeDeckQuantityBreakdowns,
  type DeckQuantityBreakdowns,
  type QuantityBucket,
} from "@/lib/decks/quantity-breakdowns";
import { isCommanderLikeFormat, type DeckBoard } from "@/lib/decks/boards";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";

export type DeckStatsCardInput = DeckInsightCardInput &
  DeckManaPipCardInput &
  DeckManaProductionCardInput &
  DeckEstCostCardInput & {
    name: string;
    cmc: number;
    colorIdentity: string[];
    rarity: string | null;
    keywords: string[];
  };

export type DeckStatsBundle = {
  insights: DeckInsights;
  composition: DeckComposition;
  curveBreakdowns: DeckCurveBreakdowns;
  quantityBreakdowns: DeckQuantityBreakdowns;
  cardNameQuantities: QuantityBucket[];
  coherence: CoherenceAlert[];
  estCost: DeckEstCost;
  manaPips: DeckManaPips;
  manaProduction: DeckManaProduction;
  manaProductionLandsOnly: DeckManaProduction;
};

export function buildDeckStatsFromCards(
  format: string,
  cards: readonly DeckStatsCardInput[],
  classificationsByOracle: Map<string, DeckInsightClassification>,
): DeckStatsBundle {
  const showCommanderBoards = isCommanderLikeFormat(format);
  const insights = summarizeDeckInsights(cards, classificationsByOracle, {
    includeSkeleton: showCommanderBoards,
  });
  const composition = summarizeDeckComposition(cards);
  const curveBreakdowns = summarizeDeckCurveBreakdowns(
    cards.map((c) => ({
      quantity: c.quantity,
      board: c.board,
      cmc: c.cmc,
      typeLine: c.typeLine,
      manaCost: c.manaCost,
      colorIdentity: c.colorIdentity,
      rarity: c.rarity,
      roles: classificationsByOracle.get(c.oracleId)?.roles ?? [],
    })),
  );
  const quantityBreakdowns = summarizeDeckQuantityBreakdowns(
    cards.map((c) => ({
      quantity: c.quantity,
      board: c.board,
      cmc: c.cmc,
      typeLine: c.typeLine,
      keywords: c.keywords,
      roles: classificationsByOracle.get(c.oracleId)?.roles ?? [],
    })),
  );
  const cardNameQuantities = summarizeDeckCardNameQuantities(cards);
  const coherence = summarizeDeckCoherence({
    format,
    composition,
    insights,
    mainCopies: mainBoardCopies(cards),
  });
  const estCost = summarizeDeckEstCost(cards);
  const manaPips = summarizeDeckManaPips(cards);
  const manaProduction = summarizeDeckManaProduction(cards);
  const manaProductionLandsOnly = summarizeDeckManaProduction(cards, {
    landsOnly: true,
  });

  return {
    insights,
    composition,
    curveBreakdowns,
    quantityBreakdowns,
    cardNameQuantities,
    coherence,
    estCost,
    manaPips,
    manaProduction,
    manaProductionLandsOnly,
  };
}

/** Narrow DeckCardView / PreconCardView rows into stats inputs. */
export function toDeckStatsCardInput(card: {
  oracleId: string;
  quantity: number;
  board: DeckBoard;
  name: string;
  typeLine: string;
  cmc: number;
  manaCost: string | null;
  producedMana: string[];
  colorIdentity: string[];
  rarity: string | null;
  keywords: string[];
  isGameChanger: boolean;
  prices: unknown;
  finish: PrintingFinish | null;
}): DeckStatsCardInput {
  return {
    oracleId: card.oracleId,
    quantity: card.quantity,
    board: card.board,
    name: card.name,
    typeLine: card.typeLine,
    cmc: card.cmc,
    manaCost: card.manaCost,
    producedMana: card.producedMana,
    colorIdentity: card.colorIdentity,
    rarity: card.rarity,
    keywords: card.keywords,
    isGameChanger: card.isGameChanger,
    prices: card.prices,
    finish: card.finish,
  };
}
