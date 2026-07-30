-- Phase 2.2: private multi-format decks (oracle-grain decklist + preferred printing)

CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deck_cards" (
    "id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "board" TEXT NOT NULL DEFAULT 'main',
    "preferred_printing_id" TEXT,

    CONSTRAINT "deck_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "decks_user_id_idx" ON "decks"("user_id");
CREATE INDEX "decks_user_id_updated_at_idx" ON "decks"("user_id", "updated_at");

CREATE UNIQUE INDEX "deck_cards_deck_id_oracle_id_board_key" ON "deck_cards"("deck_id", "oracle_id", "board");
CREATE INDEX "deck_cards_deck_id_idx" ON "deck_cards"("deck_id");
CREATE INDEX "deck_cards_oracle_id_idx" ON "deck_cards"("oracle_id");
CREATE INDEX "deck_cards_preferred_printing_id_idx" ON "deck_cards"("preferred_printing_id");

ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_preferred_printing_id_fkey" FOREIGN KEY ("preferred_printing_id") REFERENCES "printings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
