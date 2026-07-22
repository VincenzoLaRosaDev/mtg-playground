-- Defensive DB defaults for @updatedAt columns (Prisma client already sets these;
-- DEFAULT protects raw SQL / adapter edge paths that omit the column).
ALTER TABLE "users"
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "collection_items"
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
