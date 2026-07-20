-- AlterTable
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "mana_cost" TEXT;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "power" TEXT;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "toughness" TEXT;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "loyalty" TEXT;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "popularity_rank" INTEGER;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "is_game_changer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "is_reserved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "friction_score" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cards_popularity_rank_idx" ON "cards"("popularity_rank");
CREATE INDEX IF NOT EXISTS "cards_is_game_changer_idx" ON "cards"("is_game_changer");
CREATE INDEX IF NOT EXISTS "cards_is_reserved_idx" ON "cards"("is_reserved");
CREATE INDEX IF NOT EXISTS "cards_friction_score_idx" ON "cards"("friction_score");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CardRelationComponent" AS ENUM ('token', 'meld_part', 'meld_result', 'combo_piece');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "card_relations" (
    "id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "related_oracle_id" TEXT,
    "related_scryfall_id" TEXT NOT NULL,
    "component" "CardRelationComponent" NOT NULL,
    "name" TEXT NOT NULL,
    "type_line" TEXT NOT NULL,

    CONSTRAINT "card_relations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "card_relations_oracle_id_idx" ON "card_relations"("oracle_id");
CREATE INDEX IF NOT EXISTS "card_relations_related_oracle_id_idx" ON "card_relations"("related_oracle_id");
