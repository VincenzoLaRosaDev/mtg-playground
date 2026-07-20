import { Badge } from "@/components/ui/badge";
import { getCardPriceLabels } from "@/lib/scryfall/card-prices";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { cn } from "@/lib/utils";

type PriceChipProps = {
  prices: unknown;
  /** Prefer foil/etched badge when that finish is selected. */
  preferredFinish?: PrintingFinish | null;
  className?: string;
};

const badgeClassName = "h-5 shrink-0 px-1.5 text-[10px] leading-none tabular-nums";

export function PriceChip({ prices, preferredFinish, className }: PriceChipProps) {
  const { regular, foil, currency } = getCardPriceLabels(prices);

  if (!regular && !foil) {
    return null;
  }

  const preferFoil = preferredFinish === "foil" || preferredFinish === "etched";
  const sourceHint =
    currency === "EUR" ? "Scryfall EUR (Cardmarket)" : "Scryfall USD (TCGPlayer)";

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1 text-muted-foreground",
        className,
      )}
      title={sourceHint}
    >
      {preferFoil && foil ? (
        <>
          <Badge
            variant="outline"
            title={`${foil} foil · ${sourceHint}`}
            className={cn(badgeClassName, "border-primary/30 bg-primary/5 text-primary")}
          >
            {foil}
            <span className="ml-0.5 font-normal opacity-80">F</span>
          </Badge>
          {regular && regular !== foil ? (
            <Badge variant="secondary" className={badgeClassName} title={sourceHint}>
              {regular}
            </Badge>
          ) : null}
        </>
      ) : (
        <>
          {regular ? (
            <Badge variant="secondary" className={badgeClassName} title={sourceHint}>
              {regular}
            </Badge>
          ) : null}
          {foil && foil !== regular ? (
            <Badge
              variant="outline"
              title={`${foil} foil · ${sourceHint}`}
              className={cn(badgeClassName, "border-primary/30 bg-primary/5 text-primary")}
            >
              {foil}
              <span className="ml-0.5 font-normal opacity-80">F</span>
            </Badge>
          ) : null}
        </>
      )}
    </span>
  );
}
