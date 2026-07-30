/**
 * Scryfall CDN paths share a size segment (`normal`, `large`, `art_crop`, …).
 * Deck list covers want artwork-only crops (Archidekt-style).
 */

const SCRYFALL_SIZE =
  /\/(normal|large|small|png|border_crop|art_crop)\//;

/** Prefer `art_crop` for landscape covers; leave non-Scryfall URIs unchanged. */
export function toScryfallArtCropUri(
  uri: string | null | undefined,
): string | null {
  if (!uri) return null;
  if (!uri.includes("cards.scryfall.io")) return uri;
  if (uri.includes("/art_crop/")) return uri;
  return uri.replace(SCRYFALL_SIZE, "/art_crop/");
}
