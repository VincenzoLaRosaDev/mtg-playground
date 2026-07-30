/*
  Warnings:

  - You are about to drop the column `search_tsv` on the `cards` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "card_classifications_roles_gin_idx";

-- DropIndex
DROP INDEX "card_classifications_themes_gin_idx";

-- DropIndex
DROP INDEX "cards_color_identity_gin_idx";

-- DropIndex
DROP INDEX "cards_search_tsv_idx";

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "search_tsv";

-- AlterTable
ALTER TABLE "collection_items" ALTER COLUMN "quantity" SET DEFAULT 1;
