import type { ManaColor } from "@/lib/mtg/mana-types";
import { manaColorLabel } from "@/lib/mtg/mana-labels";
import { MANA_SYMBOL_INNER_SVG } from "@/lib/mtg/mana-symbol-data";

export type ManaSymbolSize = "xs" | "sm" | "md" | "lg";

const sizeClassName: Record<ManaSymbolSize, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

type ManaSymbolProps = {
  color: ManaColor;
  size?: ManaSymbolSize;
  className?: string;
  title?: string;
};

export function ManaSymbol({
  color,
  size = "sm",
  className = "",
  title,
}: ManaSymbolProps) {
  const inner = MANA_SYMBOL_INNER_SVG[color];

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title ?? manaColorLabel(color)}
      className={`inline-block shrink-0 ${sizeClassName[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
