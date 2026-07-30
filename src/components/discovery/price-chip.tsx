import { Badge } from "@/components/ui/badge";
import { getCardPriceLabels } from "@/lib/scryfall/card-prices";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { LABEL_PRIMARY_CLASS } from "@/lib/ui/selection-chrome";
import { cn } from "@/lib/utils";

type PriceChipProps = {
  prices: unknown;
  /** Prefer foil/etched badge when that finish is selected. */
  preferredFinish?: PrintingFinish | null;
  /**
   * `pair` (default): show primary finish + optional alternate.
   * `finish`: only the price for `preferredFinish` (collection / deck tiles).
   */
  mode?: "pair" | "finish";
  className?: string;
};

const badgeClassName = "h-5 shrink-0 px-1.5 text-[10px] leading-none tabular-nums";

export function PriceChip({
  prices,
  preferredFinish,
  mode = "pair",
  className,
}: PriceChipProps) {
  const { regular, foil, currency } = getCardPriceLabels(prices);
  const preferFoil = preferredFinish === "foil" || preferredFinish === "etched";
  const sourceHint =
    currency === "EUR" ? "Scryfall EUR (Cardmarket)" : "Scryfall USD (TCGPlayer)";

  if (mode === "finish") {
    const amount = preferFoil ? foil : regular;
    if (!amount) return null;

    return (
      <span
        className={cn(
          "inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1 text-muted-foreground",
          className,
        )}
        title={sourceHint}
      >
        <Badge
          variant={preferFoil ? "outline" : "secondary"}
          title={preferFoil ? `${amount} foil · ${sourceHint}` : sourceHint}
          className={cn(badgeClassName, preferFoil && LABEL_PRIMARY_CLASS)}
        >
          {amount}
          {preferFoil ? (
            <span className="ml-0.5 font-normal opacity-80">F</span>
          ) : null}
        </Badge>
      </span>
    );
  }

  if (!regular && !foil) {
    return null;
  }

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
            className={cn(badgeClassName, LABEL_PRIMARY_CLASS)}
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
              className={cn(badgeClassName, LABEL_PRIMARY_CLASS)}
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
