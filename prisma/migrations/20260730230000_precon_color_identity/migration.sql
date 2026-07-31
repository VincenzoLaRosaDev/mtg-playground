-- AlterTable
ALTER TABLE "precons" ADD COLUMN "color_identity" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "precons_type_idx" ON "precons"("type");
