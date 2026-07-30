-- Restore columns/indexes accidentally dropped by
-- 20260729163755_drop_friction_score_dev (Prisma drift SQL, not intentional).

-- FTS generated column (same definition as 20260722230000_search_tsv_strip_apostrophes)
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "search_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(
      to_tsvector(
        'english',
        regexp_replace(coalesce("name", ''), '[''′`´’]', '', 'g')
      ),
      'A'
    )
    || setweight(
      to_tsvector(
        'english',
        regexp_replace(coalesce("type_line", ''), '[''′`´’]', '', 'g')
      ),
      'B'
    )
    || setweight(
      to_tsvector(
        'english',
        regexp_replace(coalesce("search_document", ''), '[''′`´’]', '', 'g')
      ),
      'C'
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS "cards_search_tsv_idx" ON "cards" USING GIN ("search_tsv");

-- GIN indexes also dropped by the bad migration
CREATE INDEX IF NOT EXISTS "cards_color_identity_gin_idx"
  ON "cards" USING GIN ("color_identity");

CREATE INDEX IF NOT EXISTS "card_classifications_roles_gin_idx"
  ON "card_classifications" USING GIN ("roles");

CREATE INDEX IF NOT EXISTS "card_classifications_themes_gin_idx"
  ON "card_classifications" USING GIN ("themes");
