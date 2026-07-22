-- Redundant with unique (oracle_id, tag_id), which already prefixes oracle_id lookups.
DROP INDEX IF EXISTS "card_oracle_taggings_oracle_id_idx";
