import type { ManaColorKey } from "@/lib/decks/composition";

/** Bar / segment fills aligned with Scryfall mana symbol circles. */
export const MANA_BAR_FILL: Record<ManaColorKey, string> = {
  W: "#F8F6D8",
  U: "#C1D7E9",
  B: "#CAC5C0",
  R: "#E49977",
  G: "#A3C095",
  C: "#B0ABA6",
};

export const MANA_COLOR_ORDER: ManaColorKey[] = ["W", "U", "B", "R", "G", "C"];
