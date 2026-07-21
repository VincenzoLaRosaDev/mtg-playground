-- Full-text search: oracle/face corpus + weighted tsvector (name A, type B, oracle C).
ALTER TABLE "cards" ADD COLUMN "search_document" TEXT NOT NULL DEFAULT '';

-- Backfill oracle corpus from oracle_text + faces JSON (DFC/MDFC).
UPDATE "cards" SET "search_document" = lower(
  trim(
    both FROM concat_ws(
      E'\n',
      NULLIF(trim(coalesce("oracle_text", '')), ''),
      (
        SELECT string_agg(
          trim(
            concat_ws(
              E'\n',
              CASE
                WHEN face->>'name' IS NOT NULL AND face->>'name' <> "cards"."name"
                  THEN face->>'name'
                ELSE NULL
              END,
              CASE
                WHEN face->>'typeLine' IS NOT NULL AND face->>'typeLine' <> "cards"."type_line"
                  THEN face->>'typeLine'
                ELSE NULL
              END,
              NULLIF(face->>'oracleText', '')
            )
          ),
          E'\n'
        )
        FROM jsonb_array_elements(
          CASE
            WHEN "faces" IS NULL THEN '[]'::jsonb
            WHEN jsonb_typeof("faces"::jsonb) = 'array' THEN "faces"::jsonb
            ELSE '[]'::jsonb
          END
        ) AS face
      )
    )
  )
);

ALTER TABLE "cards" ADD COLUMN "search_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A')
    || setweight(to_tsvector('english', coalesce("type_line", '')), 'B')
    || setweight(to_tsvector('english', coalesce("search_document", '')), 'C')
  ) STORED;

CREATE INDEX "cards_search_tsv_idx" ON "cards" USING GIN ("search_tsv");
