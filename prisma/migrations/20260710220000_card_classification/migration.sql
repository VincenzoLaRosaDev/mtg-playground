-- CreateEnum
CREATE TYPE "OracleTagWeight" AS ENUM ('very_strong', 'strong', 'median', 'weak');

-- CreateEnum
CREATE TYPE "ClassificationSource" AS ENUM ('OVERRIDE', 'ORACLE_TAG');

-- CreateTable
CREATE TABLE "scryfall_oracle_tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parent_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scryfall_oracle_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_oracle_taggings" (
    "id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "weight" "OracleTagWeight" NOT NULL,

    CONSTRAINT "card_oracle_taggings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_classifications" (
    "oracle_id" TEXT NOT NULL,
    "roles" TEXT[],
    "themes" TEXT[],
    "source" "ClassificationSource" NOT NULL,
    "tag_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_classifications_pkey" PRIMARY KEY ("oracle_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scryfall_oracle_tags_slug_key" ON "scryfall_oracle_tags"("slug");

-- CreateIndex
CREATE INDEX "card_oracle_taggings_oracle_id_idx" ON "card_oracle_taggings"("oracle_id");

-- CreateIndex
CREATE INDEX "card_oracle_taggings_tag_id_idx" ON "card_oracle_taggings"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_oracle_taggings_oracle_id_tag_id_key" ON "card_oracle_taggings"("oracle_id", "tag_id");

-- AddForeignKey
ALTER TABLE "card_oracle_taggings" ADD CONSTRAINT "card_oracle_taggings_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "scryfall_oracle_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
