import { ManaSymbol } from "@/components/mtg/mana-symbol";
import type { ManaColorKey } from "@/lib/decks/composition";
import type { ManaColor } from "@/lib/mtg/mana-types";
import { MANA_BAR_FILL } from "@/lib/mtg/mana-palette";
import { cn } from "@/lib/utils";

export type ManaShareSegment = {
  key: ManaColorKey;
  weight: number;
};

type ManaShareBarProps = {
  segments: readonly ManaShareSegment[];
  /** Accessible name when no visible label. */
  ariaLabel?: string;
  empty?: string;
  className?: string;
  /** Segment row height. Default matches Colors stats. */
  size?: "md" | "sm";
};

/**
 * Proportional color share bar (Cost / Production / deck list preview).
 * Gaps + rounded segments; ManaSymbol centered in each slice.
 */
export function ManaShareBar({
  segments,
  ariaLabel = "Mana by color",
  empty = "No spell pips",
  className,
  size = "md",
}: ManaShareBarProps) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);
  const height = size === "sm" ? "h-7" : "h-9";
  const minW = size === "sm" ? "min-w-7" : "min-w-8";

  if (total <= 0) {
    return (
      <p
        className={cn(
          "flex items-center rounded-md border border-border/50 bg-muted/40 px-3 text-xs text-muted-foreground",
          height,
          className,
        )}
      >
        {empty}
      </p>
    );
  }

  return (
    <div
      className={cn("flex gap-1.5", height, className)}
      role="img"
      aria-label={ariaLabel}
    >
      {segments.map((seg) => {
        const share = seg.weight / total;
        return (
          <div
            key={seg.key}
            className={cn(
              "flex items-center justify-center rounded-md",
              minW,
            )}
            style={{
              flexGrow: Math.max(share * 100, 6),
              flexBasis: 0,
              backgroundColor: MANA_BAR_FILL[seg.key],
            }}
            title={`${seg.key}: ${Math.round(share * 100)}%`}
          >
            <ManaSymbol
              color={seg.key as ManaColor}
              size={size === "sm" ? "xs" : "sm"}
            />
          </div>
        );
      })}
    </div>
  );
}
