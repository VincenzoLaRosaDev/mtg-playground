import { Badge } from "@/components/ui/badge";
import { getCardPriceLabels } from "@/lib/scryfall/card-prices";
import { cn } from "@/lib/utils";

type PriceChipProps = {
  prices: unknown;
  className?: string;
};

const badgeClassName = "h-5 shrink-0 px-1.5 text-[10px] leading-none tabular-nums";

export function PriceChip({ prices, className }: PriceChipProps) {
  const { regular, foil } = getCardPriceLabels(prices);

  if (!regular && !foil) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1 text-muted-foreground",
        className,
      )}
    >
      {regular ? (
        <Badge variant="secondary" className={badgeClassName}>
          {regular}
        </Badge>
      ) : null}
      {foil && foil !== regular ? (
        <Badge
          variant="outline"
          title={`${foil} foil`}
          className={cn(badgeClassName, "border-primary/30 bg-primary/5 text-primary")}
        >
          {foil}
          <span className="ml-0.5 font-normal opacity-80">F</span>
        </Badge>
      ) : null}
    </span>
  );
}
