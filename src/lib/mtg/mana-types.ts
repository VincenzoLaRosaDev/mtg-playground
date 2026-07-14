import { MANA_COLOR_OPTIONS } from "@/lib/browse/color-identity-filter";

export type ManaColor = (typeof MANA_COLOR_OPTIONS)[number];

export function isManaColor(value: string): value is ManaColor {
  return (MANA_COLOR_OPTIONS as readonly string[]).includes(value);
}

export function normalizeManaColors(colors: string[]): ManaColor[] {
  return colors.filter(isManaColor);
}
