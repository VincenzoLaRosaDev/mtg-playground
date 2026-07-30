/**
 * Parse a Scryfall mana cost string into brace tokens (without braces).
 * Example: `{2}{W}{U}` → `["2", "W", "U"]`
 * Split costs (`{R/G} // {G}`) keep both halves’ tokens in order.
 */
export function parseManaCost(cost: string | null | undefined): string[] {
  if (!cost) return [];
  const tokens: string[] = [];
  const re = /\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cost)) !== null) {
    const inner = match[1]?.trim();
    if (inner) tokens.push(inner);
  }
  return tokens;
}
