#!/usr/bin/env node
/**
 * Re-download Scryfall mana symbol SVG inner markup into mana-symbol-data.ts.
 * Run: node scripts/vendor/mana-symbols.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const symbols = ["W", "U", "B", "R", "G", "C"];
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = join(root, "src/lib/mtg/mana-symbol-data.ts");

const entries = [];

for (const symbol of symbols) {
  const response = await fetch(`https://svgs.scryfall.io/card-symbols/${symbol}.svg`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${symbol}: ${response.status}`);
  }

  const svg = await response.text();
  const inner = svg.replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "").trim();
  entries.push(`  ${symbol}: ${JSON.stringify(inner)},`);
}

const file = `/** Vendored from Scryfall card symbols — regenerate with \`node scripts/vendor/mana-symbols.mjs\`. */\nexport const MANA_SYMBOL_INNER_SVG = {\n${entries.join("\n")}\n} as const;\n`;

writeFileSync(outPath, file, "utf8");
console.log(`Wrote ${outPath}`);
