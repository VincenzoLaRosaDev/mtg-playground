import type { SetRarity } from "@/lib/mtg/rarity-types";
import { rarityLabel } from "@/lib/mtg/rarity-labels";

export type RarityIconSize = "xs" | "sm" | "md";

const sizeClassName: Record<RarityIconSize, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
};

const rarityFill: Record<SetRarity, string> = {
  common: "#101010",
  uncommon: "#C0C0C0",
  rare: "#D4AF37",
  mythic: "#E56B1F",
  special: "#9B59B6",
  bonus: "#2ECC71",
};

type RarityIconProps = {
  rarity: SetRarity | string;
  size?: RarityIconSize;
  className?: string;
  title?: string;
};

function isSetRarity(value: string): value is SetRarity {
  return value in rarityFill;
}

export function RarityIcon({
  rarity,
  size = "sm",
  className = "",
  title,
}: RarityIconProps) {
  if (!isSetRarity(rarity)) {
    return null;
  }

  const fill = rarityFill[rarity];
  const label = title ?? rarityLabel(rarity);

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      className={`inline-block shrink-0 ${sizeClassName[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <circle cx="50" cy="50" r="46" fill={fill} stroke="#0D0F0F" strokeWidth="4" />
      {rarity === "mythic" ? (
        <circle cx="50" cy="50" r="24" fill="none" stroke="#0D0F0F" strokeWidth="4" />
      ) : null}
      {rarity === "special" || rarity === "bonus" ? (
        <path d="M50 18 L58 42 L84 42 L63 56 L71 80 L50 66 L29 80 L37 56 L16 42 L42 42 Z" fill="#F8F6D8" />
      ) : null}
    </svg>
  );
}
