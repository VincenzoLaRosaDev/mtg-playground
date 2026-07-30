-- Drop Friction score (product removal — inconsistent / low signal).
DROP INDEX IF EXISTS "cards_friction_score_idx";
ALTER TABLE "cards" DROP COLUMN IF EXISTS "friction_score";
