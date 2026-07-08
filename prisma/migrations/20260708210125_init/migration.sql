-- CreateEnum
CREATE TYPE "SyncSource" AS ENUM ('SCRYFALL', 'EDHREC', 'MTGJSON');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "search_name" TEXT NOT NULL,
    "edhrec_slug" TEXT,
    "type_line" TEXT NOT NULL,
    "cmc" DOUBLE PRECISION NOT NULL,
    "colors" TEXT[],
    "color_identity" TEXT[],
    "oracle_text" TEXT,
    "keywords" TEXT[],
    "produced_mana" TEXT[],
    "layout" TEXT NOT NULL,
    "image_uri" TEXT,
    "legalities" JSONB NOT NULL,
    "prices" JSONB,
    "is_commander" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "source" "SyncSource" NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "records_processed" INTEGER,
    "errors" JSONB,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_oracle_id_key" ON "cards"("oracle_id");

-- CreateIndex
CREATE INDEX "cards_search_name_idx" ON "cards"("search_name");

-- CreateIndex
CREATE INDEX "cards_name_idx" ON "cards"("name");

-- CreateIndex
CREATE INDEX "cards_is_commander_idx" ON "cards"("is_commander");
