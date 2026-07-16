-- Browse / sync hot-path indexes (audit Ops.8)

-- Catalog sort/filter + playable layout exclusion
CREATE INDEX "cards_cmc_idx" ON "cards"("cmc");
CREATE INDEX "cards_layout_idx" ON "cards"("layout");

-- Commander profile sort (window=all / ranked fallback) + TTL sweeps
CREATE INDEX "edhrec_commander_profiles_num_decks_idx" ON "edhrec_commander_profiles"("num_decks");
CREATE INDEX "edhrec_commander_profiles_salt_idx" ON "edhrec_commander_profiles"("salt");
CREATE INDEX "edhrec_commander_profiles_expires_at_idx" ON "edhrec_commander_profiles"("expires_at");

-- Card EDHREC legacy HOT browse sorts + TTL
CREATE INDEX "edhrec_card_data_inclusion_idx" ON "edhrec_card_data"("inclusion");
CREATE INDEX "edhrec_card_data_num_decks_idx" ON "edhrec_card_data"("num_decks");
CREATE INDEX "edhrec_card_data_salt_idx" ON "edhrec_card_data"("salt");
CREATE INDEX "edhrec_card_data_expires_at_idx" ON "edhrec_card_data"("expires_at");

-- Variant purge by expiry
CREATE INDEX "edhrec_page_variants_expires_at_idx" ON "edhrec_page_variants"("expires_at");

-- SyncLog health + --if-changed last-success queries
CREATE INDEX "sync_logs_source_job_type_started_at_idx" ON "sync_logs"("source", "job_type", "started_at");
CREATE INDEX "sync_logs_source_job_type_status_completed_at_idx" ON "sync_logs"("source", "job_type", "status", "completed_at");
