/** Oracle-tag slugs that contribute +1 toward Friction (stax / tax / denial / extra turns). */
export const FRICTION_TAG_SLUGS = new Set([
  "stax",
  "tax",
  "resource-denial",
  "extra-turn",
  "extra-turns",
  "takes-extra-turn",
  "skip-turn",
  "skip-combat",
  "skip-draw",
  "hatebear",
  "hate-bear",
  "rule-of-law",
  "sphere-effect",
  "winter-orb-effect",
  "staticorb-effect",
  "smokestack-effect",
  "mana-denial",
  "land-denial",
  "prison",
  "lock",
  "hard-lock",
]);

/**
 * Friction score 0–3:
 * - +2 if Game Changer
 * - +1 if any friction-family oracle tag
 */
export function computeFrictionScore(input: {
  isGameChanger: boolean;
  tagSlugs?: string[];
}): number {
  let score = 0;
  if (input.isGameChanger) {
    score += 2;
  }
  if (input.tagSlugs?.some((slug) => FRICTION_TAG_SLUGS.has(slug))) {
    score += 1;
  }
  return Math.min(score, 3);
}
