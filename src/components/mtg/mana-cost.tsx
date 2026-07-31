import { ManaSymbol, type ManaSymbolSize } from "@/components/mtg/mana-symbol";
import { parseManaCost } from "@/lib/mtg/mana-cost";
import { isManaColor } from "@/lib/mtg/mana-types";
import { cn } from "@/lib/utils";

type ManaCostProps = {
  cost: string | null | undefined;
  size?: ManaSymbolSize;
  className?: string;
};

const pipSizeClass: Record<ManaSymbolSize, string> = {
  // Match ManaSymbol outer box (h/w) so generic pips align with color icons.
  xs: "size-3.5 text-[10px]",
  sm: "size-5 text-xs",
  md: "size-6 text-sm",
  lg: "size-8 text-base",
  xl: "size-10 text-lg",
  "2xl": "size-12 text-xl",
};

/** Scryfall mana cost as a horizontal pip row. */
export function ManaCost({ cost, size = "xs", className }: ManaCostProps) {
  const tokens = parseManaCost(cost);
  if (tokens.length === 0) return null;

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-0.5", className)}
      aria-label={`Mana cost ${cost}`}
    >
      {tokens.map((token, index) =>
        isManaColor(token) ? (
          <ManaSymbol key={`${token}-${index}`} color={token} size={size} />
        ) : (
          <span
            key={`${token}-${index}`}
            title={token}
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-[#CAC5C0] font-semibold leading-none text-neutral-900 tabular-nums",
              pipSizeClass[size],
            )}
          >
            {token}
          </span>
        ),
      )}
    </span>
  );
}
