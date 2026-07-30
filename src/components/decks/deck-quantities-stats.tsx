"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QUANTITY_BREAKDOWN_OPTIONS,
  isQuantityBreakdownMode,
  quantitiesForMode,
  type QuantityBreakdownMode,
  type QuantityBucket,
  type DeckQuantityBreakdowns,
} from "@/lib/decks/quantity-breakdowns";

type DeckQuantitiesStatsProps = {
  quantityBreakdowns: DeckQuantityBreakdowns;
};

/**
 * Archidekt-inspired “Quantity of” selector + horizontal quantity bars.
 */
export function DeckQuantitiesStats({
  quantityBreakdowns,
}: DeckQuantitiesStatsProps) {
  const [mode, setMode] = useState<QuantityBreakdownMode>("type");
  const items = quantitiesForMode(quantityBreakdowns, mode);
  const modeItems = QUANTITY_BREAKDOWN_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="quantity-of"
          className="text-xs font-medium text-muted-foreground"
        >
          Quantity of
        </label>
        <Select
          value={mode}
          onValueChange={(next) => {
            if (next != null && isQuantityBreakdownMode(next)) {
              setMode(next);
            }
          }}
          items={modeItems}
        >
          <SelectTrigger
            id="quantity-of"
            className="h-8 w-full min-w-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {QUANTITY_BREAKDOWN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QuantityBarList items={items} emptyLabel={emptyLabelForMode(mode)} />
    </div>
  );
}

function emptyLabelForMode(mode: QuantityBreakdownMode): string {
  switch (mode) {
    case "role":
      return "No role tags on this deck.";
    case "subtype":
      return "No subtypes on these cards.";
    case "supertype":
      return "No supertypes on these cards.";
    case "keyword":
      return "No keywords on these cards.";
    default:
      return "No quantities to show.";
  }
}

function QuantityBarList({
  items,
  emptyLabel,
}: {
  items: QuantityBucket[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-1.5">
      {items.map((row) => (
        <li key={row.key} className="flex items-center gap-2 text-xs">
          <span className="w-28 shrink-0 truncate capitalize" title={row.label}>
            {row.label}
          </span>
          <div className="h-2 min-w-0 flex-1 rounded-md bg-muted">
            <div
              className="h-full rounded-md bg-primary/70"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="w-7 shrink-0 text-right tabular-nums text-muted-foreground">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
