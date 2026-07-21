-- Denormalized color sort key for Arena-like browse (WUBRG → multi → colorless, then CMC).
ALTER TABLE "cards" ADD COLUMN "color_sort" INTEGER NOT NULL DEFAULT 0;

UPDATE "cards" SET "color_sort" = CASE
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
END;

CREATE INDEX "cards_color_sort_idx" ON "cards"("color_sort");
