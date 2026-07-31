-- Slim card_relations for deck Tokens inference (token / emblem only).
CREATE TYPE "CardRelationComponent" AS ENUM ('token', 'emblem');

CREATE TABLE "card_relations" (
    "id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "related_oracle_id" TEXT NOT NULL,
    "component" "CardRelationComponent" NOT NULL,
    "name" TEXT NOT NULL,
    "type_line" TEXT NOT NULL,

    CONSTRAINT "card_relations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "card_relations_oracle_id_related_oracle_id_component_key"
  ON "card_relations"("oracle_id", "related_oracle_id", "component");

CREATE INDEX "card_relations_oracle_id_idx" ON "card_relations"("oracle_id");
CREATE INDEX "card_relations_related_oracle_id_idx" ON "card_relations"("related_oracle_id");
