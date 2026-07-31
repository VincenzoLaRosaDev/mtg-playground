"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hypergeometricPercent } from "@/lib/decks/hypergeometric";
import type { HypergeometricMode } from "@/lib/decks/hypergeometric";
import {
  ODDS_FACET_OPTIONS,
  defaultOddsFacetForFormat,
  isOddsFacetMode,
  oddsBucketsForFacet,
  type OddsFacetMode,
} from "@/lib/decks/odds-rows";
import type {
  DeckQuantityBreakdowns,
  QuantityBucket,
} from "@/lib/decks/quantity-breakdowns";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: { value: HypergeometricMode; label: string }[] = [
  { value: "atLeast", label: "At least" },
  { value: "exactly", label: "Exactly" },
];

type DeckOddsStatsProps = {
  format: string;
  deckSize: number;
  quantityBreakdowns: DeckQuantityBreakdowns;
  cardNameQuantities: QuantityBucket[];
};

/**
 * Archidekt-inspired draw odds: At least/Exactly · K · by facet · N cards.
 */
export function DeckOddsStats({
  format,
  deckSize,
  quantityBreakdowns,
  cardNameQuantities,
}: DeckOddsStatsProps) {
  const [mode, setMode] = useState<HypergeometricMode>("atLeast");
  const [target, setTarget] = useState(1);
  const [facet, setFacet] = useState<OddsFacetMode>(() =>
    defaultOddsFacetForFormat(format),
  );
  const [facetFormat, setFacetFormat] = useState(format);
  const [draws, setDraws] = useState(Math.min(7, Math.max(1, deckSize)));

  // Reset facet default when format changes (avoid setState-in-effect).
  if (format !== facetFormat) {
    setFacetFormat(format);
    setFacet(defaultOddsFacetForFormat(format));
  }

  const safeDeck = Math.max(0, deckSize);
  const safeDraws = Math.min(safeDeck, Math.max(1, draws));
  const safeTarget = Math.max(mode === "exactly" ? 0 : 1, target);

  const buckets = oddsBucketsForFacet(
    facet,
    quantityBreakdowns,
    cardNameQuantities,
  );

  const rows = buckets
    .map((row) => {
      const pct = hypergeometricPercent({
        mode,
        deckSize: safeDeck,
        successes: Math.min(row.count, safeDeck),
        draws: safeDraws,
        target: safeTarget,
      });
      return { ...row, pct };
    })
    .sort((a, b) => {
      const ap = a.pct ?? -1;
      const bp = b.pct ?? -1;
      if (bp !== ap) return bp - ap;
      return b.count - a.count || a.label.localeCompare(b.label);
    });

  const modeItems = MODE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const facetItems = ODDS_FACET_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  if (safeDeck < 1) {
    return (
      <p className="text-xs text-muted-foreground">
        Odds appear once the main deck has cards.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center">
        <span className="shrink-0 font-medium text-foreground/80">
          Probability of drawing
        </span>
        <Select
          value={mode}
          onValueChange={(next) => {
            if (next === "atLeast" || next === "exactly") setMode(next);
          }}
          items={modeItems}
        >
          <SelectTrigger className="h-8 w-auto min-w-28" aria-label="Odds mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {MODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NumberField
          label="Target copies"
          value={safeTarget}
          min={mode === "exactly" ? 0 : 1}
          max={Math.max(1, safeDraws)}
          onChange={setTarget}
        />
        <span className="shrink-0">card(s) by</span>
        <Select
          value={facet}
          onValueChange={(next) => {
            if (next != null && isOddsFacetMode(next)) setFacet(next);
          }}
          items={facetItems}
        >
          <SelectTrigger className="h-8 w-auto min-w-32" aria-label="Odds by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {ODDS_FACET_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0">having drawn</span>
        <NumberField
          label="Cards drawn"
          value={safeDraws}
          min={1}
          max={safeDeck}
          onChange={setDraws}
        />
        <span className="shrink-0">card(s)</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Main + commander · {safeDeck}{" "}
        {safeDeck === 1 ? "card" : "cards"}
      </p>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No rows for this facet.</p>
      ) : (
        <div className="max-h-[min(28rem,70vh)] overflow-auto rounded-md border border-border/50">
          <table className="w-full min-w-[16rem] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="px-2.5 py-1.5 font-medium">
                  {facetColumnLabel(facet)}
                </th>
                <th className="w-14 px-2.5 py-1.5 text-right font-medium">
                  Qty
                </th>
                <th className="w-16 px-2.5 py-1.5 text-right font-medium">
                  Odds
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.key}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    index % 2 === 1 && "bg-muted/15",
                  )}
                >
                  <td
                    className={cn(
                      "max-w-[14rem] truncate px-2.5 py-1.5",
                      facet !== "cardName" && "capitalize",
                    )}
                    title={row.label}
                  >
                    {row.label}
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-foreground">
                    {row.count}
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums">
                    {row.pct == null ? "—" : `${row.pct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function facetColumnLabel(facet: OddsFacetMode): string {
  return ODDS_FACET_OPTIONS.find((o) => o.value === facet)?.label ?? "Name";
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      min={min}
      max={max}
      className="h-8 w-14 rounded-md border border-border bg-background px-1.5 text-center text-xs tabular-nums text-foreground"
      value={value}
      onChange={(e) => {
        const n = Math.floor(Number(e.target.value));
        if (!Number.isFinite(n)) return;
        onChange(Math.min(max, Math.max(min, n)));
      }}
    />
  );
}
