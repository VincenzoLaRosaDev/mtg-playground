-- CreateTable
CREATE TABLE "precons" (
    "id" TEXT NOT NULL,
    "mtgjson_file_name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "release_date" TIMESTAMP(3),
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "precons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precon_cards" (
    "id" TEXT NOT NULL,
    "precon_id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "board" TEXT NOT NULL DEFAULT 'main',
    "preferred_printing_id" TEXT,

    CONSTRAINT "precon_cards_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "decks" ADD COLUMN "source_precon_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "precons_mtgjson_file_name_key" ON "precons"("mtgjson_file_name");

-- CreateIndex
CREATE UNIQUE INDEX "precons_slug_key" ON "precons"("slug");

-- CreateIndex
CREATE INDEX "precons_format_idx" ON "precons"("format");

-- CreateIndex
CREATE INDEX "precons_release_date_idx" ON "precons"("release_date");

-- CreateIndex
CREATE INDEX "precons_name_idx" ON "precons"("name");

-- CreateIndex
CREATE INDEX "precon_cards_precon_id_idx" ON "precon_cards"("precon_id");

-- CreateIndex
CREATE INDEX "precon_cards_oracle_id_idx" ON "precon_cards"("oracle_id");

-- CreateIndex
CREATE INDEX "precon_cards_preferred_printing_id_idx" ON "precon_cards"("preferred_printing_id");

-- CreateIndex
CREATE UNIQUE INDEX "precon_cards_precon_id_oracle_id_board_key" ON "precon_cards"("precon_id", "oracle_id", "board");

-- CreateIndex
CREATE INDEX "decks_source_precon_id_idx" ON "decks"("source_precon_id");

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_source_precon_id_fkey" FOREIGN KEY ("source_precon_id") REFERENCES "precons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precon_cards" ADD CONSTRAINT "precon_cards_precon_id_fkey" FOREIGN KEY ("precon_id") REFERENCES "precons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precon_cards" ADD CONSTRAINT "precon_cards_preferred_printing_id_fkey" FOREIGN KEY ("preferred_printing_id") REFERENCES "printings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
