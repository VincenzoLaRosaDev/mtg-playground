"use client";

import { useState } from "react";

import { ManaSymbol } from "@/components/mtg/mana-symbol";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CurveBucket, DeckComposition } from "@/lib/decks/composition";
import {
  CURVE_BREAKDOWN_OPTIONS,
  isCurveBreakdownMode,
  seriesForMode,
  type CurveBreakdownMode,
  type CurveSeries,
  type DeckCurveBreakdowns,
} from "@/lib/decks/curve-breakdowns";
import type { ManaColor } from "@/lib/mtg/mana-types";
import { MANA_BAR_FILL } from "@/lib/mtg/mana-palette";
import { cn } from "@/lib/utils";

type DeckCurveStatsProps = {
  composition: DeckComposition;
  curveBreakdowns: DeckCurveBreakdowns;
};

/**
 * Archidekt-inspired mana curve: overall chart + “by” facet mini-curves.
 */
export function DeckCurveStats({
  composition,
  curveBreakdowns,
}: DeckCurveStatsProps) {
  const [mode, setMode] = useState<CurveBreakdownMode>("color");
  const series = seriesForMode(curveBreakdowns, mode);
  const modeItems = CURVE_BREAKDOWN_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-0.5 text-sm">
        <p>
          <span className="text-muted-foreground">Avg Mana Value</span>{" "}
          <span className="font-medium tabular-nums">
            {composition.avgManaValue.toFixed(2)}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Total Mana Value{" "}
          <span className="tabular-nums text-foreground/80">
            {composition.totalManaValue.toFixed(2)}
          </span>
          <span className="text-muted-foreground"> · nonlands</span>
        </p>
      </div>

      <ManaCurveChart
        curve={composition.curve}
        barClassName="bg-primary/75"
        size="lg"
      />

      <div className="space-y-1.5">
        <label
          htmlFor="mana-curve-by"
          className="text-xs font-medium text-muted-foreground"
        >
          Mana curve by
        </label>
        <Select
          value={mode}
          onValueChange={(next) => {
            if (next != null && isCurveBreakdownMode(next)) {
              setMode(next);
            }
          }}
          items={modeItems}
        >
          <SelectTrigger id="mana-curve-by" className="h-8 w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {CURVE_BREAKDOWN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {series.map((row) => (
          <li key={row.key}>
            <CurveSeriesCard series={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CurveSeriesCard({ series }: { series: CurveSeries }) {
  const active = series.total > 0;
  const barColor = series.manaColor
    ? MANA_BAR_FILL[series.manaColor]
    : undefined;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-3",
        !active && "opacity-55",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {series.manaColor ? (
          <ManaSymbol
            color={series.manaColor as ManaColor}
            size="sm"
            className={cn(!active && "grayscale")}
          />
        ) : null}
        <p className="truncate text-xs font-medium">{series.label}</p>
      </div>
      <ManaCurveChart
        curve={series.curve}
        barClassName={barColor ? undefined : "bg-muted-foreground/55"}
        barColor={barColor}
        size="sm"
        showZeroCounts={false}
      />
    </div>
  );
}

function ManaCurveChart({
  curve,
  barClassName,
  barColor,
  size,
  showZeroCounts = true,
}: {
  curve: CurveBucket[];
  barClassName?: string;
  barColor?: string;
  size: "sm" | "lg";
  showZeroCounts?: boolean;
}) {
  const max = Math.max(1, ...curve.map((b) => b.count));
  const chartH = size === "lg" ? 96 : 64;
  const minBar = size === "lg" ? 8 : 6;

  return (
    <div className="space-y-1">
      <div
        className={cn("flex items-end gap-1", size === "lg" ? "h-32" : "h-24")}
      >
        {curve.map((bucket) => {
          const h =
            bucket.count > 0
              ? Math.max(minBar, (bucket.count / max) * chartH)
              : 2;
          return (
            <div
              key={bucket.key}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5"
            >
              <span
                className={cn(
                  "tabular-nums text-muted-foreground",
                  size === "lg" ? "text-[11px]" : "text-[10px]",
                )}
              >
                {bucket.count > 0 || showZeroCounts
                  ? bucket.count > 0
                    ? bucket.count
                    : ""
                  : ""}
              </span>
              <div
                className={cn(
                  "w-1/2 min-w-2 rounded-t-md",
                  bucket.count === 0
                    ? "bg-muted"
                    : !barColor
                      ? barClassName
                      : undefined,
                )}
                style={{
                  height: `${h}px`,
                  backgroundColor:
                    bucket.count > 0 && barColor ? barColor : undefined,
                }}
                title={`${bucket.key}: ${bucket.count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 border-t border-border/60 pt-1">
        {curve.map((bucket) => (
          <span
            key={bucket.key}
            className={cn(
              "min-w-0 flex-1 text-center tabular-nums text-muted-foreground",
              size === "lg" ? "text-[10px]" : "text-[9px]",
            )}
          >
            {bucket.key}
          </span>
        ))}
      </div>
    </div>
  );
}
