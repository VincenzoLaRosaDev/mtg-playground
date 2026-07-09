-- CreateTable
CREATE TABLE "mtg_sets" (
    "code" TEXT NOT NULL,
    "scryfall_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "released_at" TIMESTAMP(3),
    "set_type" TEXT NOT NULL,
    "card_count" INTEGER NOT NULL,
    "icon_uri" TEXT,
    "digital" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mtg_sets_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "set_cards" (
    "id" TEXT NOT NULL,
    "set_code" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collector_number" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "image_uri" TEXT,

    CONSTRAINT "set_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mtg_sets_scryfall_id_key" ON "mtg_sets"("scryfall_id");

-- CreateIndex
CREATE INDEX "mtg_sets_released_at_idx" ON "mtg_sets"("released_at");

-- CreateIndex
CREATE INDEX "mtg_sets_name_idx" ON "mtg_sets"("name");

-- CreateIndex
CREATE INDEX "mtg_sets_set_type_idx" ON "mtg_sets"("set_type");

-- CreateIndex
CREATE INDEX "set_cards_set_code_idx" ON "set_cards"("set_code");

-- CreateIndex
CREATE INDEX "set_cards_oracle_id_idx" ON "set_cards"("oracle_id");

-- CreateIndex
CREATE INDEX "set_cards_rarity_idx" ON "set_cards"("rarity");

-- CreateIndex
CREATE UNIQUE INDEX "set_cards_set_code_oracle_id_key" ON "set_cards"("set_code", "oracle_id");

-- AddForeignKey
ALTER TABLE "set_cards" ADD CONSTRAINT "set_cards_set_code_fkey" FOREIGN KEY ("set_code") REFERENCES "mtg_sets"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_cards" ADD CONSTRAINT "set_cards_oracle_id_fkey" FOREIGN KEY ("oracle_id") REFERENCES "cards"("oracle_id") ON DELETE SET NULL ON UPDATE CASCADE;
