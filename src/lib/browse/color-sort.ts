/**
 * Arena / Scryfall-style color order key for browse sort.
 * Mono W→U→B→R→G, then multicolor (WUBRG bitmask), then colorless.
 * Secondary sort in queries: cmc → name → id.
 */

const COLOR_BIT: Record<string, number> = {
  W: 1,
  U: 2,
  B: 4,
  R: 8,
  G: 16,
};

const MONO_KEY: Record<string, number> = {
  W: 100,
  U: 200,
  B: 300,
  R: 400,
  G: 500,
};

export const COLOR_SORT_MULTICOLOR_BASE = 600;
export const COLOR_SORT_COLORLESS = 700;

/** Stable bitmask for multicolor cards (W=1, U=2, B=4, R=8, G=16). */
export function colorBitmask(colors: readonly string[]): number {
  let bits = 0;
  for (const color of colors) {
    const bit = COLOR_BIT[color];
    if (bit != null) bits |= bit;
  }
  return bits;
}

/**
 * Denormalized sort key stored on `cards.color_sort`.
 * Must stay in sync with the SQL backfill in the color_sort migration.
 */
export function computeColorSortKey(colors: readonly string[]): number {
  if (colors.length === 0) {
    return COLOR_SORT_COLORLESS;
  }
  if (colors.length === 1) {
    return MONO_KEY[colors[0]!] ?? COLOR_SORT_MULTICOLOR_BASE;
  }
  return COLOR_SORT_MULTICOLOR_BASE + colorBitmask(colors);
}

/**
 * Postgres expression used in migrations / docs — mirrors `computeColorSortKey`.
 * Kept as a string for tests that assert parity with the JS implementation.
 */
export const COLOR_SORT_SQL_EXPRESSION = `
CASE
  WHEN cardinality(colors) = 0 THEN 700
  WHEN cardinality(colors) = 1 AND colors = ARRAY['W']::text[] THEN 100
  WHEN cardinality(colors) = 1 AND colors = ARRAY['U']::text[] THEN 200
  WHEN cardinality(colors) = 1 AND colors = ARRAY['B']::text[] THEN 300
  WHEN cardinality(colors) = 1 AND colors = ARRAY['R']::text[] THEN 400
  WHEN cardinality(colors) = 1 AND colors = ARRAY['G']::text[] THEN 500
  WHEN cardinality(colors) > 1 THEN 600
    + (CASE WHEN 'W' = ANY(colors) THEN 1 ELSE 0 END)
    + (CASE WHEN 'U' = ANY(colors) THEN 2 ELSE 0 END)
    + (CASE WHEN 'B' = ANY(colors) THEN 4 ELSE 0 END)
    + (CASE WHEN 'R' = ANY(colors) THEN 8 ELSE 0 END)
    + (CASE WHEN 'G' = ANY(colors) THEN 16 ELSE 0 END)
  ELSE 600
END
`.trim();
