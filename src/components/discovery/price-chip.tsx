import { Badge } from "@/components/ui/badge";
import { getCardPriceLabels } from "@/lib/scryfall/card-prices";
import { cn } from "@/lib/utils";

type PriceChipProps = {
  prices: unknown;
  className?: string;
};

export function PriceChip({ prices, className }: PriceChipProps) {
  const { regular, foil } = getCardPriceLabels(prices);

  if (!regular && !foil) {
    return null;
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {regular ? (
        <Badge variant="secondary" className="tabular-nums">
          {regular}
        </Badge>
      ) : null}
      {foil && foil !== regular ? (
        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary tabular-nums">
          {foil} foil
        </Badge>
      ) : null}
    </span>
  );
}
