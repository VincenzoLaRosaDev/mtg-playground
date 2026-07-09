-- CreateEnum
CREATE TYPE "EdhrecSyncTier" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateTable
CREATE TABLE "edhrec_commander_profiles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "card_id" TEXT,
    "rank" INTEGER,
    "salt" DOUBLE PRECISION,
    "num_decks" INTEGER,
    "color_identity" TEXT[],
    "tag_counts" JSONB NOT NULL DEFAULT '{}',
    "similar_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cardlists" JSONB NOT NULL DEFAULT '{}',
    "bracket_counts" JSONB,
    "budget_counts" JSONB,
    "sync_tier" "EdhrecSyncTier" NOT NULL DEFAULT 'HOT',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "edhrec_commander_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edhrec_card_data" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "card_id" TEXT,
    "salt" DOUBLE PRECISION,
    "num_decks" INTEGER,
    "inclusion" INTEGER,
    "cardlists" JSONB NOT NULL DEFAULT '{}',
    "similar_cards" JSONB NOT NULL DEFAULT '[]',
    "sync_tier" "EdhrecSyncTier" NOT NULL DEFAULT 'HOT',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "edhrec_card_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "edhrec_commander_profiles_slug_key" ON "edhrec_commander_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "edhrec_commander_profiles_card_id_key" ON "edhrec_commander_profiles"("card_id");

-- CreateIndex
CREATE INDEX "edhrec_commander_profiles_rank_idx" ON "edhrec_commander_profiles"("rank");

-- CreateIndex
CREATE INDEX "edhrec_commander_profiles_name_idx" ON "edhrec_commander_profiles"("name");

-- CreateIndex
CREATE INDEX "edhrec_commander_profiles_sync_tier_idx" ON "edhrec_commander_profiles"("sync_tier");

-- CreateIndex
CREATE UNIQUE INDEX "edhrec_card_data_slug_key" ON "edhrec_card_data"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "edhrec_card_data_card_id_key" ON "edhrec_card_data"("card_id");

-- CreateIndex
CREATE INDEX "edhrec_card_data_name_idx" ON "edhrec_card_data"("name");

-- CreateIndex
CREATE INDEX "edhrec_card_data_sync_tier_idx" ON "edhrec_card_data"("sync_tier");

-- CreateIndex
CREATE INDEX "cards_edhrec_slug_idx" ON "cards"("edhrec_slug");

-- AddForeignKey
ALTER TABLE "edhrec_commander_profiles" ADD CONSTRAINT "edhrec_commander_profiles_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edhrec_card_data" ADD CONSTRAINT "edhrec_card_data_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
