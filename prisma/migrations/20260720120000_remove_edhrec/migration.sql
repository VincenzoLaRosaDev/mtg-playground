-- DropForeignKey
ALTER TABLE "edhrec_commander_profiles" DROP CONSTRAINT IF EXISTS "edhrec_commander_profiles_card_id_fkey";

-- DropForeignKey
ALTER TABLE "edhrec_card_data" DROP CONSTRAINT IF EXISTS "edhrec_card_data_card_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "edhrec_page_variants";

-- DropTable
DROP TABLE IF EXISTS "edhrec_top_entries";

-- DropTable
DROP TABLE IF EXISTS "edhrec_card_data";

-- DropTable
DROP TABLE IF EXISTS "edhrec_commander_profiles";

-- DropEnum
DROP TYPE IF EXISTS "EdhrecPageEntityType";

-- DropEnum
DROP TYPE IF EXISTS "EdhrecTopWindow";

-- DropEnum
DROP TYPE IF EXISTS "EdhrecTopEntityType";

-- DropEnum
DROP TYPE IF EXISTS "EdhrecSyncTier";

-- Delete historical EDHREC sync logs before removing enum value
DELETE FROM "sync_logs" WHERE "source" = 'EDHREC';

-- RenameIndex
DROP INDEX IF EXISTS "cards_edhrec_slug_idx";

-- RenameColumn
ALTER TABLE "cards" RENAME COLUMN "edhrec_slug" TO "slug";

-- CreateIndex
CREATE INDEX "cards_slug_idx" ON "cards"("slug");

-- AlterEnum: recreate SyncSource without EDHREC
CREATE TYPE "SyncSource_new" AS ENUM ('SCRYFALL', 'MTGJSON');
ALTER TABLE "sync_logs" ALTER COLUMN "source" TYPE "SyncSource_new" USING ("source"::text::"SyncSource_new");
DROP TYPE "SyncSource";
ALTER TYPE "SyncSource_new" RENAME TO "SyncSource";
