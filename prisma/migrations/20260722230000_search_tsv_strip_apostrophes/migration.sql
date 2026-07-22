-- Align FTS index with query sanitize / slug: strip apostrophes before to_tsvector
-- so Y'shtola / Yshtola both match lexeme "yshtola" (Postgres otherwise splits on ').

DROP INDEX IF EXISTS "cards_search_tsv_idx";

ALTER TABLE "cards" DROP COLUMN "search_tsv";

ALTER TABLE "cards" ADD COLUMN "search_tsv" tsvector
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

CREATE INDEX "cards_search_tsv_idx" ON "cards" USING GIN ("search_tsv");
