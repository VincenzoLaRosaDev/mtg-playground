import { Layers } from "lucide-react";

import { PriceChip } from "@/components/discovery/price-chip";
import { SaltBadge } from "@/components/discovery/salt-badge";
import {
  MetricIconLabel,
  SynergyMetricLabel,
} from "@/components/discovery/metric-icon-label";
import {
  formatCompactCount,
  formatSynergyPercent,
} from "@/lib/display/formatters";

export type EntityPreviewPrimary =
  | { kind: "inclusion"; value: string | null }
  | { kind: "rank"; value: string | null };

type EntityPreviewFooterProps = {
  prices?: unknown;
  primary?: EntityPreviewPrimary | null;
  /** Overrides the default “inclusion” / “rank” caption next to the primary value. */
  primaryCaption?: string | null;
  decks?: number | null;
  /** Shown when non-null (commander-context list tiles). */
  synergy?: number | null;
  salt?: number | null;
};

export function EntityPreviewFooter({
  prices,
  primary,
  primaryCaption,
  decks,
  synergy,
  salt,
}: EntityPreviewFooterProps) {
  const primaryValue =
    primary?.value != null && primary.value !== "—" ? primary.value : null;
  const synergyLabel =
    synergy != null ? formatSynergyPercent(synergy) : null;
  const showSynergy = synergyLabel != null && synergyLabel !== "—";
  const showDecks = decks != null;
  const showSalt = salt != null;
  const caption =
    primaryCaption ??
    (primary?.kind === "inclusion" ? "inclusion" : primary?.kind === "rank" ? "Rank" : null);
  const showPrices = prices != null;
  const showPrimaryRow = primaryValue != null || showDecks;

  if (!showPrices && !primaryValue && !showDecks && !showSynergy && !showSalt) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-1">
      {showPrices || showSalt ? (
        <div className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-1.5">
          {showPrices ? <PriceChip prices={prices} className="min-w-0" /> : <span />}
          {showSalt ? <SaltBadge salt={salt!} className="h-5 shrink-0 px-1.5 text-[10px]" /> : null}
        </div>
      ) : null}

      {showPrimaryRow ? (
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          {primaryValue ? (
            <p className="min-w-0 text-base font-semibold leading-tight tabular-nums tracking-tight text-foreground">
              {primary?.kind === "rank" ? (
                <>
                  {caption ? <span>{caption} </span> : null}
                  <span>{primaryValue}</span>
                </>
              ) : (
                <>
                  <span>{primaryValue}</span>
                  {caption ? <span> {caption}</span> : null}
                </>
              )}
            </p>
          ) : (
            <span />
          )}
          {showDecks ? (
            <MetricIconLabel
              icon={<Layers className="h-3.5 w-3.5" aria-hidden />}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-base font-semibold tabular-nums tracking-tight text-foreground"
            >
              <span className="sr-only">decks </span>
              {formatCompactCount(decks!)}
            </MetricIconLabel>
          ) : null}
        </div>
      ) : null}

      {showSynergy ? (
        <div className="flex min-w-0 items-center">
          <SynergyMetricLabel value={synergyLabel!} />
        </div>
      ) : null}
    </div>
  );
}
