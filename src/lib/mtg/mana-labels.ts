import type { ManaColor } from "@/lib/mtg/mana-types";

const MANA_COLOR_LABELS: Record<ManaColor, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

export function manaColorLabel(color: ManaColor): string {
  return MANA_COLOR_LABELS[color];
}

export function formatColorIdentityLabel(colors: string[]): string {
  if (colors.length === 0) {
    return "Colorless";
  }

  return colors.map((color) => MANA_COLOR_LABELS[color as ManaColor] ?? color).join(", ");
}
