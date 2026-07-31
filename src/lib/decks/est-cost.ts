/**
 * Estimated deck cost from preferred-printing Scryfall prices (EUR-first).
 * Counts main + commander only.
 */

import type { DeckBoard } from "@/lib/decks/boards";
import {
  CATALOG_PRICE_CURRENCY,
  formatMoneyAmountForCurrency,
  pickCatalogPriceStrings,
  type CatalogPriceCurrency,
} from "@/lib/scryfall/card-prices";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";

const COUNTED_BOARDS = new Set<DeckBoard>(["main", "commander"]);

export type DeckEstCostCardInput = {
  quantity: number;
  board: DeckBoard;
  prices: unknown;
  finish: PrintingFinish | null;
};

export type DeckEstCost = {
  /** Sum of unit prices × qty; null when no priced copies. */
  total: number | null;
  currency: CatalogPriceCurrency;
  /** Formatted label, e.g. `€12.34`, or null. */
  label: string | null;
  /** Copies that contributed a price. */
  pricedCopies: number;
  /** Counted copies missing a usable price. */
  unpricedCopies: number;
};

function unitPrice(
  prices: unknown,
  finish: PrintingFinish | null,
): { amount: number; currency: CatalogPriceCurrency } | null {
  const picked = pickCatalogPriceStrings(prices);
  const preferFoil = finish === "foil" || finish === "etched";
  const raw = preferFoil
    ? (picked.foil ?? picked.regular)
    : (picked.regular ?? picked.foil);
  if (!raw) return null;
  const amount = Number.parseFloat(raw);
  if (!Number.isFinite(amount)) return null;
  return { amount, currency: picked.currency };
}

export function summarizeDeckEstCost(
  cards: readonly DeckEstCostCardInput[],
): DeckEstCost {
  let total = 0;
  let pricedCopies = 0;
  let unpricedCopies = 0;
  let currency: CatalogPriceCurrency = CATALOG_PRICE_CURRENCY;
  let sawPrice = false;

  for (const card of cards) {
    if (!COUNTED_BOARDS.has(card.board)) continue;
    const qty = card.quantity;
    if (qty < 1) continue;

    const unit = unitPrice(card.prices, card.finish);
    if (!unit) {
      unpricedCopies += qty;
      continue;
    }
    sawPrice = true;
    currency = unit.currency;
    total += unit.amount * qty;
    pricedCopies += qty;
  }

  if (!sawPrice) {
    return {
      total: null,
      currency: CATALOG_PRICE_CURRENCY,
      label: null,
      pricedCopies: 0,
      unpricedCopies,
    };
  }

  const rounded = Math.round(total * 100) / 100;
  return {
    total: rounded,
    currency,
    label: formatMoneyAmountForCurrency(String(rounded), currency),
    pricedCopies,
    unpricedCopies,
  };
}
