-- CreateEnum
CREATE TYPE "EdhrecTopEntityType" AS ENUM ('CARD', 'COMMANDER');

-- CreateEnum
CREATE TYPE "EdhrecTopWindow" AS ENUM ('WEEK', 'MONTH', 'YEAR', 'ALL');

-- CreateEnum
CREATE TYPE "EdhrecPageEntityType" AS ENUM ('CARD', 'COMMANDER');

-- CreateTable
CREATE TABLE "edhrec_top_entries" (
    "id" TEXT NOT NULL,
    "entity_type" "EdhrecTopEntityType" NOT NULL,
    "window" "EdhrecTopWindow" NOT NULL,
    "rank" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "num_decks" INTEGER,
    "inclusion" INTEGER,
    "potential_decks" INTEGER,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edhrec_top_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edhrec_page_variants" (
    "id" TEXT NOT NULL,
    "entity_type" "EdhrecPageEntityType" NOT NULL,
    "slug" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT '',
    "budget" TEXT NOT NULL DEFAULT '',
    "bracket" TEXT NOT NULL DEFAULT '',
    "payload" JSONB NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "edhrec_page_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "edhrec_top_entries_entity_type_window_rank_idx" ON "edhrec_top_entries"("entity_type", "window", "rank");

-- CreateIndex
CREATE INDEX "edhrec_top_entries_slug_idx" ON "edhrec_top_entries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "edhrec_top_entries_entity_type_window_slug_key" ON "edhrec_top_entries"("entity_type", "window", "slug");

-- CreateIndex
CREATE INDEX "edhrec_page_variants_entity_type_slug_idx" ON "edhrec_page_variants"("entity_type", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "edhrec_page_variants_entity_type_slug_theme_budget_bracket_key" ON "edhrec_page_variants"("entity_type", "slug", "theme", "budget", "bracket");
