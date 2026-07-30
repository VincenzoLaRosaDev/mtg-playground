"use client";

import { ManaShareBar } from "@/components/mtg/mana-share-bar";
import { ManaSymbol } from "@/components/mtg/mana-symbol";
import type { ManaColorKey } from "@/lib/decks/composition";
import type { DeckManaPips } from "@/lib/decks/mana-pips";
import type { DeckManaProduction } from "@/lib/decks/mana-production";
import type { ManaColor } from "@/lib/mtg/mana-types";
import { MANA_BAR_FILL, MANA_COLOR_ORDER } from "@/lib/mtg/mana-palette";
import { cn } from "@/lib/utils";

type ColorRow = {
  key: ManaColorKey;
  pips: number;
  costCards: number;
  costPercent: number;
  mana: number;
  prodCards: number;
  prodPercent: number;
};

type DeckColorsStatsProps = {
  manaPips: DeckManaPips;
  manaProduction: DeckManaProduction;
  includeColorless: boolean;
  onIncludeColorless: (v: boolean) => void;
  landsOnlyProduction: boolean;
  onLandsOnlyProduction: (v: boolean) => void;
};

function pct(part: number, total: number): number {
  if (total <= 0 || part <= 0) return 0;
  return Math.round((part / total) * 100);
}

function buildColorRows(
  manaPips: DeckManaPips,
  manaProduction: DeckManaProduction,
  includeColorless: boolean,
): ColorRow[] {
  const costByKey = new Map(manaPips.buckets.map((b) => [b.key, b]));
  const prodByKey = new Map(manaProduction.buckets.map((b) => [b.key, b]));

  const costTotal = includeColorless
    ? manaPips.totalPips
    : manaPips.buckets
        .filter((b) => b.key !== "C")
        .reduce((sum, b) => sum + b.pips, 0);
  const prodTotal = includeColorless
    ? manaProduction.totalSources
    : manaProduction.buckets
        .filter((b) => b.key !== "C")
        .reduce((sum, b) => sum + b.mana, 0);

  const keys = includeColorless
    ? MANA_COLOR_ORDER
    : MANA_COLOR_ORDER.filter((k) => k !== "C");

  return keys.map((key) => {
    const cost = costByKey.get(key);
    const prod = prodByKey.get(key);
    const pips = cost?.pips ?? 0;
    const mana = prod?.mana ?? 0;
    return {
      key,
      pips,
      costCards: cost?.cards ?? 0,
      costPercent: pct(pips, costTotal),
      mana,
      prodCards: prod?.cards ?? 0,
      prodPercent: pct(mana, prodTotal),
    };
  });
}

/**
 * Archidekt-inspired color cost vs production: summary shares + per-color cards.
 */
export function DeckColorsStats({
  manaPips,
  manaProduction,
  includeColorless,
  onIncludeColorless,
  landsOnlyProduction,
  onLandsOnlyProduction,
}: DeckColorsStatsProps) {
  const rows = buildColorRows(manaPips, manaProduction, includeColorless);
  const costSegments = rows
    .filter((r) => r.pips > 0)
    .map((r) => ({ key: r.key, weight: r.pips }));
  const prodSegments = rows
    .filter((r) => r.mana > 0)
    .map((r) => ({ key: r.key, weight: r.mana }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <label className="inline-flex items-center gap-1.5 text-muted-foreground">
          <input
            type="checkbox"
            checked={includeColorless}
            onChange={(e) => onIncludeColorless(e.target.checked)}
          />
          Include colorless
        </label>
        <label className="inline-flex items-center gap-1.5 text-muted-foreground">
          <input
            type="checkbox"
            checked={landsOnlyProduction}
            onChange={(e) => onLandsOnlyProduction(e.target.checked)}
          />
          Lands only for production
        </label>
      </div>

      <div className="space-y-2">
        <ShareBarRow label="Cost" segments={costSegments} empty="No spell pips" />
        <ShareBarRow
          label="Production"
          segments={prodSegments}
          empty="No production data"
        />
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <li key={row.key}>
            <ColorStatCard row={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShareBarRow({
  label,
  segments,
  empty,
}: {
  label: string;
  segments: { key: ManaColorKey; weight: number }[];
  empty: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ManaShareBar
        segments={segments}
        ariaLabel={`${label} by color`}
        empty={empty}
      />
    </div>
  );
}

function ColorStatCard({ row }: { row: ColorRow }) {
  const hasCost = row.pips > 0;
  const hasProd = row.mana > 0;
  const active = hasCost || hasProd;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-3",
        !active && "opacity-55",
      )}
    >
      <ManaSymbol
        color={row.key as ManaColor}
        size="2xl"
        className={cn(!hasCost && active && "opacity-70", !active && "grayscale")}
      />

      <MetricBlock
        label="Cost"
        percent={row.costPercent}
        fill={MANA_BAR_FILL[row.key]}
        detail={`${row.pips} pips · ${row.costCards} cards`}
        active={hasCost}
      />
      <MetricBlock
        label="Production"
        percent={row.prodPercent}
        fill={MANA_BAR_FILL[row.key]}
        detail={`${row.mana} mana · ${row.prodCards} cards`}
        active={hasProd}
      />
    </div>
  );
}

function MetricBlock({
  label,
  percent,
  fill,
  detail,
  active,
}: {
  label: string;
  percent: number;
  fill: string;
  detail: string;
  active: boolean;
}) {
  return (
    <div className="w-full space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="relative h-5 w-full overflow-hidden rounded-md bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-md transition-[width]"
          style={{
            width: `${Math.min(100, percent)}%`,
            backgroundColor: active ? fill : "transparent",
          }}
        />
        <span
          className={cn(
            "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded px-1.5 py-px text-[10px] font-semibold tabular-nums shadow-sm",
            active
              ? "bg-background/95 text-foreground"
              : "bg-muted-foreground/20 text-muted-foreground",
          )}
        >
          {percent}%
        </span>
      </div>
      <p className="text-center text-[10px] tabular-nums text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}
