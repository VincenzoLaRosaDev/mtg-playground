import { ManaSymbol, type ManaSymbolSize } from "@/components/mtg/mana-symbol";
import { formatColorIdentityLabel } from "@/lib/mtg/mana-labels";
import { normalizeManaColors } from "@/lib/mtg/mana-types";

type ColorIdentityProps = {
  colors: string[];
  size?: ManaSymbolSize;
  className?: string;
  showColorless?: boolean;
};

export function ColorIdentity({
  colors,
  size = "xs",
  className = "",
  showColorless = true,
}: ColorIdentityProps) {
  const symbols = normalizeManaColors(colors);
  const label = formatColorIdentityLabel(symbols);

  if (symbols.length === 0) {
    if (!showColorless) {
      return null;
    }

    return (
      <span className={`inline-flex items-center ${className}`} title={label}>
        <ManaSymbol color="C" size={size} />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} title={label}>
      {symbols.map((color) => (
        <ManaSymbol key={color} color={color} size={size} />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}
