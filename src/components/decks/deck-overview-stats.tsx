"use client";

import { ManaSymbol } from "@/components/mtg/mana-symbol";
import type { CoherenceAlert } from "@/lib/decks/coherence";
import type { DeckComposition } from "@/lib/decks/composition";
import { hypergeometricAtLeastPercent } from "@/lib/decks/hypergeometric";
import type { DeckInsights } from "@/lib/decks/insights";
import type { DeckManaPips } from "@/lib/decks/mana-pips";
import type { DeckQuantityBreakdowns } from "@/lib/decks/quantity-breakdowns";
import type { ManaColor } from "@/lib/mtg/mana-types";
import { cn } from "@/lib/utils";

const ODDS_DRAWS = 7;

type DeckOverviewStatsProps = {
  insights: DeckInsights;
  composition: DeckComposition;
  coherence: CoherenceAlert[];
  manaPips: DeckManaPips;
  quantityBreakdowns: DeckQuantityBreakdowns;
};

/**
 * Dashboard overview: advisories + compact snapshots from other stats sections.
 */
export function DeckOverviewStats({
  insights,
  composition,
  coherence,
  manaPips,
  quantityBreakdowns,
}: DeckOverviewStatsProps) {
  const curvePeak = [...composition.curve].sort(
    (a, b) => b.count - a.count || a.cmc - b.cmc,
  )[0];
  const topRole = quantityBreakdowns.byRole.find(
    (r) => r.key !== "uncategorized" && r.count > 0,
  );
  const topType = quantityBreakdowns.byType.find((t) => t.count > 0);
  const topPips = [...manaPips.buckets]
    .filter((b) => b.key !== "C" && b.pips > 0)
    .sort((a, b) => b.pips - a.pips)
    .slice(0, 3);

  const landOdds =
    composition.countedCopies > 0
      ? hypergeometricAtLeastPercent({
          deckSize: composition.countedCopies,
          successes: composition.landCopies,
          draws: Math.min(ODDS_DRAWS, composition.countedCopies),
          atLeast: 1,
        })
      : null;

  const topThemes = insights.themeOverlap.topThemes.slice(0, 3);

  return (
    <div className="space-y-4">
      {coherence.length > 0 ? (
        <ul className="space-y-1.5" aria-label="Coherence hints">
          {coherence.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs leading-snug",
                alert.severity === "warning"
                  ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  : "bg-muted/50 text-muted-foreground",
              )}
            >
              {alert.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          No coherence warnings — build looks within soft guidelines.
        </p>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Snapshot
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <SnapshotTile
            label="Game changers"
            value={String(insights.gameChangerCount)}
          />
          <SnapshotTile
            label="Top role"
            value={topRole ? `${topRole.label} ×${topRole.count}` : "—"}
          />
          <SnapshotTile
            label="Top type"
            value={topType ? `${topType.label} ×${topType.count}` : "—"}
          />
          <SnapshotTile
            label="Curve peak"
            value={
              curvePeak && curvePeak.count > 0
                ? `MV ${curvePeak.key} · ${curvePeak.count}`
                : "—"
            }
          />
          <SnapshotTile
            label={`Land odds (≥1 in ${ODDS_DRAWS})`}
            value={landOdds == null ? "—" : `${landOdds}%`}
          />
          <SnapshotTile
            label="Themed"
            value={
              insights.themeOverlap.themedCopies > 0
                ? `${insights.themeOverlap.themedPercent}%`
                : "—"
            }
          />
        </ul>
      </div>

      {topPips.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Top color cost
          </p>
          <ul className="flex flex-wrap gap-2">
            {topPips.map((pip) => (
              <li
                key={pip.key}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-xs"
              >
                <ManaSymbol color={pip.key as ManaColor} size="sm" />
                <span className="tabular-nums text-muted-foreground">
                  {pip.pips} pips
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Mana curve</p>
        <MiniCurve composition={composition} />
      </div>

      {insights.skeleton && insights.skeleton.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Build skeleton
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {insights.skeleton.map((row) => {
              const pct =
                row.target > 0
                  ? Math.min(100, Math.round((row.inDeck / row.target) * 100))
                  : 0;
              const met = row.inDeck >= row.target;
              return (
                <li key={row.key} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span>{row.label}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        met
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {row.inDeck}/{row.target}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        met ? "bg-emerald-600/70" : "bg-muted-foreground/45",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {topThemes.length > 0 || insights.themeOverlap.themedCopies > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Themes</span>
          {" · "}
          Themed {insights.themeOverlap.themedPercent}%
          {insights.themeOverlap.multiThemeCopies > 0
            ? ` · Multi-theme ×${insights.themeOverlap.multiThemeCopies}`
            : ""}
          {topThemes.length > 0
            ? ` · Top: ${topThemes.map((t) => t.label).join(", ")}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

function SnapshotTile({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-md border border-border/50 bg-muted/15 px-2.5 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium tabular-nums">{value}</p>
    </li>
  );
}

function MiniCurve({ composition }: { composition: DeckComposition }) {
  const max = Math.max(1, ...composition.curve.map((b) => b.count));
  return (
    <div className="flex h-24 items-end gap-1">
      {composition.curve.map((bucket) => (
        <div
          key={bucket.key}
          className="flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5"
          title={`${bucket.key}: ${bucket.count}`}
        >
          <div
            className={cn(
              "w-1/2 min-w-2 rounded-t-md",
              bucket.count > 0 ? "bg-primary/70" : "bg-muted",
            )}
            style={{
              height: `${Math.max(
                bucket.count > 0 ? 6 : 2,
                (bucket.count / max) * 72,
              )}px`,
            }}
          />
          <span className="text-[9px] tabular-nums text-muted-foreground">
            {bucket.key}
          </span>
        </div>
      ))}
    </div>
  );
}
