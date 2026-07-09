import type { ScryfallCard } from "@/lib/scryfall/types";

export function normalizeSearchName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * EDHREC slug heuristic — validated against API during EDHREC sync.
 * NFKD accent strip; apostrophes removed (Gorion's → gorions, O'Maul → omaul).
 */
export function toEdhrecSlug(name: string): string {
  const primary = name.split("//")[0]?.trim() ?? name;

  return primary
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''`´]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isCommanderLegal(card: ScryfallCard): boolean {
  if (card.legalities?.commander !== "legal") {
    return false;
  }

  const typeLine = card.type_line.toLowerCase();
  const isLegendary = typeLine.includes("legendary");
  const isCreatureOrPlaneswalker =
    typeLine.includes("creature") || typeLine.includes("planeswalker");

  return isLegendary && isCreatureOrPlaneswalker;
}

export function getImageUri(card: ScryfallCard): string | null {
  if (card.image_uris?.normal) {
    return card.image_uris.normal;
  }

  return card.card_faces?.[0]?.image_uris?.normal ?? null;
}

export function getCmc(card: ScryfallCard): number {
  return card.mana_value ?? card.cmc ?? 0;
}
