-- Neon cost Wave B/C: denormalized list price + min rarity, GIN/filter indexes,
-- drop redundant tagging oracle_id index (covered by unique).

ALTER TABLE "cards"
  ADD COLUMN IF NOT EXISTS "list_price_eur" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "min_rarity" TEXT,
  ADD COLUMN IF NOT EXISTS "min_rarity_rank" INTEGER;

CREATE INDEX IF NOT EXISTS "cards_list_price_eur_idx" ON "cards"("list_price_eur");
CREATE INDEX IF NOT EXISTS "cards_min_rarity_rank_idx" ON "cards"("min_rarity_rank");

-- GIN for CI / classification array filters
CREATE INDEX IF NOT EXISTS "cards_color_identity_gin_idx"
  ON "cards" USING GIN ("color_identity");

CREATE INDEX IF NOT EXISTS "card_classifications_roles_gin_idx"
  ON "card_classifications" USING GIN ("roles");

CREATE INDEX IF NOT EXISTS "card_classifications_themes_gin_idx"
  ON "card_classifications" USING GIN ("themes");

CREATE INDEX IF NOT EXISTS "printings_oracle_id_released_at_idx"
  ON "printings"("oracle_id", "released_at" DESC);

-- Backfill list_price_eur from cards.prices JSON (EUR then USD)
UPDATE "cards"
SET "list_price_eur" = CASE
  WHEN NULLIF(prices->>'eur', '') IS NOT NULL
    THEN (prices->>'eur')::double precision
  WHEN NULLIF(prices->>'usd', '') IS NOT NULL
    THEN (prices->>'usd')::double precision
  ELSE NULL
END
WHERE "list_price_eur" IS NULL;

-- Backfill min rarity from printings
UPDATE "cards" c
SET
  "min_rarity_rank" = sub.min_rank,
  "min_rarity" = CASE sub.min_rank
    WHEN 0 THEN 'common'
    WHEN 1 THEN 'uncommon'
    WHEN 2 THEN 'rare'
    WHEN 3 THEN 'mythic'
    WHEN 4 THEN 'special'
    WHEN 5 THEN 'bonus'
    ELSE NULL
  END
FROM (
  SELECT
    oracle_id,
    MIN(
      CASE rarity
        WHEN 'common' THEN 0
        WHEN 'uncommon' THEN 1
        WHEN 'rare' THEN 2
        WHEN 'mythic' THEN 3
        WHEN 'special' THEN 4
        WHEN 'bonus' THEN 5
        ELSE 99
      END
    ) AS min_rank
  FROM printings
  GROUP BY oracle_id
) sub
WHERE c.oracle_id = sub.oracle_id
  AND sub.min_rank < 99;

-- Redundant with unique (oracle_id, tag_id)
DROP INDEX IF EXISTS "card_oracle_taggings_oracle_id_idx";
