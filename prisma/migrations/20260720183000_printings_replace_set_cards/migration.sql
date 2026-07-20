-- Phase 2.0.5: replace set_cards with full printings (set + collector number)

CREATE TABLE "printings" (
    "id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "set_code" TEXT NOT NULL,
    "collector_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "digital" BOOLEAN NOT NULL DEFAULT false,
    "finishes" TEXT[] NOT NULL,
    "image_uri" TEXT,
    "faces" JSONB,
    "prices" JSONB,
    "illustration_id" TEXT,
    "released_at" TIMESTAMP(3),
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "printings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "printings_set_code_collector_number_key" ON "printings"("set_code", "collector_number");
CREATE INDEX "printings_oracle_id_idx" ON "printings"("oracle_id");
CREATE INDEX "printings_set_code_idx" ON "printings"("set_code");
CREATE INDEX "printings_rarity_idx" ON "printings"("rarity");

ALTER TABLE "printings" ADD CONSTRAINT "printings_set_code_fkey" FOREIGN KEY ("set_code") REFERENCES "mtg_sets"("code") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "set_cards";
