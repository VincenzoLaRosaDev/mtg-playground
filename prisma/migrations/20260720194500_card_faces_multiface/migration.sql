-- Phase 2.0.6: oracle-level faces for multiface UI on browse tiles
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "faces" JSONB;

-- Backfill from any printing that already has faces (lowest collector # per oracle)
UPDATE "cards" AS c
SET "faces" = p."faces"
FROM (
  SELECT DISTINCT ON ("oracle_id") "oracle_id", "faces"
  FROM "printings"
  WHERE "faces" IS NOT NULL
  ORDER BY "oracle_id", "collector_number" ASC
) AS p
WHERE c."oracle_id" = p."oracle_id"
  AND c."faces" IS NULL;
