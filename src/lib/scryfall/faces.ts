import type { Prisma } from "@/generated/prisma/client";

import type { ScryfallCard } from "@/lib/scryfall/types";

export type CardFaceImage = {
  name: string;
  imageUri: string | null;
  manaCost?: string | null;
  typeLine?: string | null;
  oracleText?: string | null;
  power?: string | null;
  toughness?: string | null;
  loyalty?: string | null;
};

/** Persistable face list from Scryfall `card_faces` (printings + oracle sync). */
export function mapScryfallFaces(card: ScryfallCard): Prisma.InputJsonValue | null {
  if (!card.card_faces?.length) {
    return null;
  }

  return card.card_faces.map((face) => ({
    name: face.name,
    imageUri: face.image_uris?.normal ?? null,
    manaCost: face.mana_cost ?? null,
    typeLine: face.type_line ?? null,
    oracleText: face.oracle_text ?? null,
    power: face.power ?? null,
    toughness: face.toughness ?? null,
    loyalty: face.loyalty ?? null,
  }));
}

export function parseCardFaces(value: unknown): CardFaceImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const faces: CardFaceImage[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const row = entry as Record<string, unknown>;
    if (typeof row.name !== "string") {
      continue;
    }
    faces.push({
      name: row.name,
      imageUri: typeof row.imageUri === "string" ? row.imageUri : null,
      manaCost: typeof row.manaCost === "string" ? row.manaCost : null,
      typeLine: typeof row.typeLine === "string" ? row.typeLine : null,
      oracleText: typeof row.oracleText === "string" ? row.oracleText : null,
      power: typeof row.power === "string" ? row.power : null,
      toughness: typeof row.toughness === "string" ? row.toughness : null,
      loyalty: typeof row.loyalty === "string" ? row.loyalty : null,
    });
  }
  return faces;
}

/** Faces that can be flipped in UI (at least two with images). */
export function flipFaceUris(
  faces: CardFaceImage[] | null | undefined,
  fallbackImageUri?: string | null,
): string[] {
  const fromFaces = (faces ?? [])
    .map((face) => face.imageUri)
    .filter((uri): uri is string => Boolean(uri));

  if (fromFaces.length >= 2) {
    return fromFaces;
  }

  if (fallbackImageUri) {
    return [fallbackImageUri];
  }

  return fromFaces;
}

export function canFlipFaces(
  faces: CardFaceImage[] | null | undefined,
): boolean {
  return flipFaceUris(faces).length >= 2;
}
