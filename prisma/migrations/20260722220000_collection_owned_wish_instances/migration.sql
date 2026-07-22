-- CollectionItem: owned and wish are separate rows for the same printing+finish.
-- Unique grain becomes (user_id, printing_id, finish, wantlist).
-- Drop the old unique first so we can insert wish siblings alongside owned rows.

DROP INDEX IF EXISTS "collection_items_user_id_printing_id_finish_key";

-- Dual-flagged rows (qty > 0 AND wantlist): keep as owned, add a wish sibling qty 1.
CREATE TEMP TABLE collection_dual_owned AS
SELECT id, user_id, printing_id, finish, created_at
FROM collection_items
WHERE wantlist = true AND quantity > 0;

INSERT INTO collection_items (
  id,
  user_id,
  printing_id,
  finish,
  quantity,
  wantlist,
  created_at,
  updated_at
)
SELECT
  replace(gen_random_uuid()::text, '-', ''),
  user_id,
  printing_id,
  finish,
  1,
  true,
  created_at,
  CURRENT_TIMESTAMP
FROM collection_dual_owned;

UPDATE collection_items
SET wantlist = false
WHERE id IN (SELECT id FROM collection_dual_owned);

DROP TABLE collection_dual_owned;

-- Wish-only rows with qty 0 → desired count 1.
UPDATE collection_items
SET quantity = 1
WHERE wantlist = true AND quantity = 0;

-- Drop empty owned rows if any.
DELETE FROM collection_items
WHERE wantlist = false AND quantity = 0;

CREATE UNIQUE INDEX "collection_items_user_id_printing_id_finish_wantlist_key"
  ON "collection_items"("user_id", "printing_id", "finish", "wantlist");
