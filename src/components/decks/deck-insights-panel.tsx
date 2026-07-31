"use client";

import { useState, type ReactNode } from "react";

import { DeckColorsStats } from "@/components/decks/deck-colors-stats";
import { DeckCurveStats } from "@/components/decks/deck-curve-stats";
import { DeckOddsStats } from "@/components/decks/deck-odds-stats";
import { DeckOverviewStats } from "@/components/decks/deck-overview-stats";
import { DeckQuantitiesStats } from "@/components/decks/deck-quantities-stats";
import type { CoherenceAlert } from "@/lib/decks/coherence";
import type { DeckComposition } from "@/lib/decks/composition";
import type { DeckCurveBreakdowns } from "@/lib/decks/curve-breakdowns";
import type { DeckEstCost } from "@/lib/decks/est-cost";
import type { DeckInsights } from "@/lib/decks/insights";
import type { DeckManaPips } from "@/lib/decks/mana-pips";
import type { DeckManaProduction } from "@/lib/decks/mana-production";
import type {
  DeckQuantityBreakdowns,
  QuantityBucket,
} from "@/lib/decks/quantity-breakdowns";
import { cn } from "@/lib/utils";

type DeckInsightsPanelProps = {
  format: string;
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
  /** Section title (deck editor vs precon PDP). */
  heading?: string;
  emptyMessage?: string;
  className?: string;
};

/**
 * Archidekt-inspired deck stats below the list: header + responsive section grid.
 */
export function DeckInsightsPanel({
  format,
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
  heading = "Deck stats",
  emptyMessage = "Deck stats appear once the main deck has cards.",
  className,
}: DeckInsightsPanelProps) {
  const [includeColorless, setIncludeColorless] = useState(true);
  const [landsOnlyProduction, setLandsOnlyProduction] = useState(false);

  if (insights.countedCopies === 0 && composition.countedCopies === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby="deck-stats-heading"
    >
      <div className="space-y-1">
        <h2
          id="deck-stats-heading"
          className="font-heading text-lg font-semibold"
        >
          {heading}
        </h2>
        <StatsHeader composition={composition} estCost={estCost} />
      </div>

      <div className="space-y-4">
        <StatCell title="Overview" className="w-full 2xl:max-w-[50%]">
          <DeckOverviewStats
            insights={insights}
            composition={composition}
            coherence={coherence}
            manaPips={manaPips}
            quantityBreakdowns={quantityBreakdowns}
          />
        </StatCell>

        {/*
          Column mosaic at lg+: left Colors→Quantities, right Mana curve→Odds.
          Below lg, `contents` + order keeps reading order Colors → Curve → Quantities → Odds.
        */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            <StatCell title="Colors" className="order-1">
              <DeckColorsStats
                manaPips={manaPips}
                manaProduction={
                  landsOnlyProduction ? manaProductionLandsOnly : manaProduction
                }
                includeColorless={includeColorless}
                onIncludeColorless={setIncludeColorless}
                landsOnlyProduction={landsOnlyProduction}
                onLandsOnlyProduction={setLandsOnlyProduction}
              />
            </StatCell>
            <StatCell title="Quantities" className="order-3">
              <DeckQuantitiesStats quantityBreakdowns={quantityBreakdowns} />
            </StatCell>
          </div>
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            <StatCell title="Mana curve" className="order-2">
              <DeckCurveStats
                composition={composition}
                curveBreakdowns={curveBreakdowns}
              />
            </StatCell>
            <StatCell title="Odds" className="order-4">
              <DeckOddsStats
                format={format}
                deckSize={composition.countedCopies}
                quantityBreakdowns={quantityBreakdowns}
                cardNameQuantities={cardNameQuantities}
              />
            </StatCell>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCell({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-border/60 bg-background/60 px-3 py-3",
        className,
      )}
    >
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

function StatsHeader({
  composition,
  estCost,
}: {
  composition: DeckComposition;
  estCost: DeckEstCost;
}) {
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      <span>
        Size{" "}
        <span className="font-medium tabular-nums text-foreground">
          {composition.countedCopies}
        </span>
      </span>
      <span>
        Avg MV{" "}
        <span className="font-medium tabular-nums text-foreground">
          {composition.avgManaValue.toFixed(2)}
        </span>
      </span>
      <span>
        Est{" "}
        <span className="font-medium tabular-nums text-foreground">
          {estCost.label ?? "—"}
        </span>
      </span>
      <span>
        Lands{" "}
        <span className="font-medium tabular-nums text-foreground">
          {composition.landCopies}
        </span>{" "}
        ({composition.landPercent}%)
      </span>
    </p>
  );
}
