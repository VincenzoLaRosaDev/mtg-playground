/**
 * Resolves staple definitions to oracle_id and writes scripts/data/card-overrides.json.
 * Run: npm run sync:build-card-overrides
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

import type { CardOverrideEntry, CardOverridesFile } from "../../src/lib/classification/types";

config({ path: ".env.local" });
config({ path: ".env" });

type StapleDef = {
  name: string;
  roles?: CardOverrideEntry["roles"];
  themes?: CardOverrideEntry["themes"];
  note?: string;
};

/** Competitive Commander staples — override Tagger where MVP needs precision. */
const STAPLES: StapleDef[] = [
  // Mana / ramp
  { name: "Sol Ring", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Mana Crypt", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Mana Vault", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Grim Monolith", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Chrome Mox", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Mox Diamond", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Jeweled Lotus", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Arcane Signet", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Fellwar Stone", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Dominance", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Curiosity", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Impulse", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Indulgence", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Progress", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Hierarchy", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Resilience", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Creativity", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Talisman of Conviction", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Commander's Sphere", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Mind Stone", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Thought Vessel", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Prismatic Lens", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Worn Powerstone", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Basalt Monolith", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Thran Dynamo", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Gilded Lotus", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Cultivate", roles: ["ramp"] },
  { name: "Kodama's Reach", roles: ["ramp"] },
  { name: "Farseek", roles: ["ramp"] },
  { name: "Nature's Lore", roles: ["ramp"] },
  { name: "Three Visits", roles: ["ramp"] },
  { name: "Rampant Growth", roles: ["ramp"] },
  { name: "Skyshroud Claim", roles: ["ramp"] },
  { name: "Harrow", roles: ["ramp"] },
  { name: "Explosive Vegetation", roles: ["ramp"] },
  { name: "Sakura-Tribe Elder", roles: ["ramp"], themes: ["sacrifice_aristocrats"] },
  { name: "Solemn Simulacrum", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Burnished Hart", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Wayfarer's Bauble", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Expedition Map", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Thawing Glaciers", roles: ["ramp"] },
  { name: "Ancient Tomb", roles: ["ramp"] },
  { name: "City of Brass", roles: ["ramp"] },
  { name: "Mana Confluence", roles: ["ramp"] },
  { name: "Command Tower", roles: ["ramp"] },
  { name: "Exotic Orchard", roles: ["ramp"] },
  { name: "Path of Ancestry", roles: ["ramp"] },
  { name: "Reliquary Tower", roles: ["ramp"] },

  // Hard removal
  { name: "Swords to Plowshares", roles: ["removal_hard"] },
  { name: "Path to Exile", roles: ["removal_hard"] },
  { name: "Anguished Unmaking", roles: ["removal_hard"] },
  { name: "Vindicate", roles: ["removal_hard"] },
  { name: "Generous Gift", roles: ["removal_hard"] },
  { name: "Beast Within", roles: ["removal_hard"] },
  { name: "Chaos Warp", roles: ["removal_hard"] },
  { name: "Cyclonic Rift", roles: ["removal_hard", "removal_soft"] },
  { name: "Toxic Deluge", roles: ["removal_hard"] },
  { name: "Blasphemous Act", roles: ["removal_hard"], themes: ["burn"] },
  { name: "Wrath of God", roles: ["removal_hard"] },
  { name: "Damnation", roles: ["removal_hard"] },
  { name: "Farewell", roles: ["removal_hard"] },
  { name: "Austere Command", roles: ["removal_hard"] },
  { name: "Despark", roles: ["removal_hard"] },
  { name: "Mortify", roles: ["removal_hard"] },
  { name: "Putrefy", roles: ["removal_hard"] },
  { name: "Terminate", roles: ["removal_hard"] },
  { name: "Dismember", roles: ["removal_hard"] },
  { name: "Murder", roles: ["removal_hard"] },
  { name: "Hero's Downfall", roles: ["removal_hard"] },
  { name: "Go for the Throat", roles: ["removal_hard"] },
  { name: "Assassin's Trophy", roles: ["removal_hard"] },
  { name: "Abrupt Decay", roles: ["removal_hard"] },
  { name: "Nature's Claim", roles: ["removal_hard"] },
  { name: "Return to Nature", roles: ["removal_hard"] },
  { name: "Disenchant", roles: ["removal_hard"] },
  { name: "Nature's Chant", roles: ["removal_hard"] },
  { name: "Wear // Tear", roles: ["removal_hard"] },

  // Soft removal
  { name: "Evacuation", roles: ["removal_soft"] },
  { name: "Aether Gust", roles: ["removal_soft"] },
  { name: "Snap", roles: ["removal_soft"] },
  { name: "Capsize", roles: ["removal_soft"] },
  { name: "Reality Shift", roles: ["removal_soft"] },
  { name: "Chandra's Ignition", roles: ["removal_soft"], themes: ["burn"] },

  // Draw
  { name: "Rhystic Study", roles: ["draw"] },
  { name: "Mystic Remora", roles: ["draw"] },
  { name: "Phyrexian Arena", roles: ["draw"] },
  { name: "Necropotence", roles: ["draw"] },
  { name: "Ad Nauseam", roles: ["draw"] },
  { name: "Consecrated Sphinx", roles: ["draw"] },
  { name: "Sylvan Library", roles: ["draw"] },
  { name: "Guardian Project", roles: ["draw"] },
  { name: "Beast Whisperer", roles: ["draw"] },
  { name: "Soul of the Harvest", roles: ["draw"] },
  { name: "Tireless Tracker", roles: ["draw"], themes: ["plus_one_counters"] },
  { name: "Tireless Provisioner", roles: ["draw", "ramp"], themes: ["landfall"] },
  { name: "Dark Confidant", roles: ["draw"] },
  { name: "The One Ring", roles: ["draw"], themes: ["artifacts_matter"] },
  { name: "Skullclamp", roles: ["draw"], themes: ["equipment_voltron"] },
  { name: "Sensei's Divining Top", roles: ["draw"], themes: ["artifacts_matter"] },
  { name: "Scroll Rack", roles: ["draw"], themes: ["artifacts_matter"] },
  { name: "Brainstorm", roles: ["draw"] },
  { name: "Ponder", roles: ["draw"] },
  { name: "Preordain", roles: ["draw"] },
  { name: "Serum Visions", roles: ["draw"] },
  { name: "Consider", roles: ["draw"] },
  { name: "Opt", roles: ["draw"] },
  { name: "Impulse", roles: ["draw"] },
  { name: "Anticipate", roles: ["draw"] },
  { name: "Fact or Fiction", roles: ["draw"] },
  { name: "Pull from Tomorrow", roles: ["draw"] },
  { name: "Blue Sun's Zenith", roles: ["draw"] },
  { name: "Stroke of Genius", roles: ["draw"] },
  { name: "Harmonize", roles: ["draw"] },
  { name: "Rishkar's Expertise", roles: ["draw", "ramp"] },
  { name: "Shamanic Revelation", roles: ["draw"] },
  { name: "Plumb the Forbidden", roles: ["draw"], themes: ["sacrifice_aristocrats"] },

  // Counterspells
  { name: "Counterspell", roles: ["counter"] },
  { name: "Negate", roles: ["counter"] },
  { name: "Dispel", roles: ["counter"] },
  { name: "Swan Song", roles: ["counter"] },
  { name: "Flusterstorm", roles: ["counter"] },
  { name: "Mana Drain", roles: ["counter", "ramp"] },
  { name: "Force of Will", roles: ["counter"] },
  { name: "Force of Negation", roles: ["counter"] },
  { name: "Pact of Negation", roles: ["counter"] },
  { name: "Fierce Guardianship", roles: ["counter"] },
  { name: "Deflecting Swat", roles: ["counter"] },
  { name: "Silence", roles: ["counter"] },
  { name: "Grand Abolisher", roles: ["counter"] },
  { name: "Autumn's Veil", roles: ["counter"] },
  { name: "Veil of Summer", roles: ["counter"] },
  { name: "Tale's End", roles: ["counter"] },
  { name: "Disallow", roles: ["counter"] },
  { name: "Dovin's Veto", roles: ["counter"] },
  { name: "Narset's Reversal", roles: ["counter"] },
  { name: "Mystical Dispute", roles: ["counter"] },
  { name: "An Offer You Can't Refuse", roles: ["counter", "ramp"] },
  { name: "Delay", roles: ["counter"] },
  { name: "Stifle", roles: ["counter"] },

  // Discard
  { name: "Wheel of Fortune", roles: ["discard", "draw"] },
  { name: "Timetwister", roles: ["discard", "draw"] },
  { name: "Windfall", roles: ["discard", "draw"] },
  { name: "Echo of Eons", roles: ["discard", "draw"] },
  { name: "Inquisition of Kozilek", roles: ["discard"] },
  { name: "Thoughtseize", roles: ["discard"] },
  { name: "Duress", roles: ["discard"] },
  { name: "Hymn to Tourach", roles: ["discard"] },
  { name: "Mind Twist", roles: ["discard"] },
  { name: "Waste Not", roles: ["discard"], themes: ["discard_madness"] },
  { name: "Oppression", roles: ["discard"] },
  { name: "Bottomless Pit", roles: ["discard"] },
  { name: "The Rack", roles: ["discard"] },

  // Tutors (not functional role in MVP — themes only where relevant)
  { name: "Demonic Tutor", themes: ["discard_madness"] },
  { name: "Vampiric Tutor", themes: ["discard_madness"] },
  { name: "Imperial Seal", themes: ["discard_madness"] },
  { name: "Gamble", themes: ["discard_madness"] },
  { name: "Enlightened Tutor", themes: ["artifacts_matter", "equipment_voltron"] },
  { name: "Mystical Tutor", themes: ["spells_matter"] },
  { name: "Worldly Tutor", themes: ["tribal"] },
  { name: "Green Sun's Zenith", themes: ["tribal"] },

  // Sacrifice / aristocrats
  { name: "Ashnod's Altar", roles: ["ramp"], themes: ["sacrifice_aristocrats", "artifacts_matter"] },
  { name: "Phyrexian Altar", roles: ["ramp"], themes: ["sacrifice_aristocrats", "artifacts_matter"] },
  { name: "Altar of Dementia", themes: ["sacrifice_aristocrats", "mill"] },
  { name: "Viscera Seer", themes: ["sacrifice_aristocrats"] },
  { name: "Carrion Feeder", themes: ["sacrifice_aristocrats"] },
  { name: "Blood Artist", themes: ["sacrifice_aristocrats", "life_gain_drain"] },
  { name: "Zulaport Cutthroat", themes: ["sacrifice_aristocrats", "life_gain_drain"] },
  { name: "Bastion of Remembrance", themes: ["sacrifice_aristocrats", "life_gain_drain"] },
  { name: "Grave Pact", themes: ["sacrifice_aristocrats"] },
  { name: "Dictate of Erebos", themes: ["sacrifice_aristocrats"] },
  { name: "Yahenni, Undying Partisan", themes: ["sacrifice_aristocrats"] },
  { name: "Ophiomancer", themes: ["sacrifice_aristocrats"] },

  // Graveyard
  { name: "Reanimate", themes: ["graveyard_recursion"] },
  { name: "Animate Dead", themes: ["graveyard_recursion"] },
  { name: "Dance of the Dead", themes: ["graveyard_recursion"] },
  { name: "Necromancy", themes: ["graveyard_recursion"] },
  { name: "Living Death", themes: ["graveyard_recursion"] },
  { name: "Victimize", themes: ["graveyard_recursion"] },
  { name: "Persist", themes: ["graveyard_recursion"] },
  { name: "Karmic Guide", themes: ["graveyard_recursion"] },
  { name: "Sun Titan", themes: ["graveyard_recursion", "landfall"] },
  { name: "Muldrotha, the Gravetide", themes: ["graveyard_recursion"] },

  // Tokens
  { name: "Doubling Season", themes: ["tokens", "plus_one_counters"] },
  { name: "Anointed Procession", themes: ["tokens"] },
  { name: "Parallel Lives", themes: ["tokens"] },
  { name: "Peregrin Took", themes: ["tokens"] },
  { name: "Hornet Queen", themes: ["tokens"] },
  { name: "Secure the Wastes", themes: ["tokens"] },
  { name: "March of the Multitudes", themes: ["tokens"] },

  // Landfall
  { name: "Azusa, Lost but Seeking", themes: ["landfall"] },
  { name: "Scute Swarm", themes: ["landfall"] },
  { name: "Rampaging Baloths", themes: ["landfall"] },
  { name: "Lotus Cobra", roles: ["ramp"], themes: ["landfall"] },
  { name: "Dryad of the Ilysian Grove", roles: ["ramp"], themes: ["landfall"] },

  // Equipment / voltron
  { name: "Sword of Feast and Famine", themes: ["equipment_voltron"] },
  { name: "Sword of Fire and Ice", themes: ["equipment_voltron"] },
  { name: "Sword of Light and Shadow", themes: ["equipment_voltron"] },
  { name: "Shadowspear", themes: ["equipment_voltron", "artifacts_matter"] },
  { name: "Stoneforge Mystic", themes: ["equipment_voltron", "artifacts_matter"] },
  { name: "Puresteel Paladin", themes: ["equipment_voltron", "artifacts_matter"] },
  { name: "Sigarda's Aid", themes: ["equipment_voltron"] },

  // Artifacts
  { name: "Urza's Saga", themes: ["artifacts_matter"] },
  { name: "Krark-Clan Ironworks", themes: ["artifacts_matter", "sacrifice_aristocrats"] },
  { name: "Mox Opal", roles: ["ramp"], themes: ["artifacts_matter"] },
  { name: "Lion's Eye Diamond", roles: ["ramp"], themes: ["artifacts_matter"] },

  // Blink
  { name: "Ephemerate", themes: ["blink_flicker"] },
  { name: "Restoration Angel", themes: ["blink_flicker"] },
  { name: "Soulherder", themes: ["blink_flicker"] },
  { name: "Brago, King Eternal", themes: ["blink_flicker"] },
  { name: "Yorion, Sky Nomad", themes: ["blink_flicker"] },

  // Burn
  { name: "Lightning Bolt", themes: ["burn"] },
  { name: "Chain Lightning", themes: ["burn"] },
  { name: "Gut Shot", themes: ["burn"] },
  { name: "Fiery Islet", themes: ["burn"] },
  { name: "Neheb, the Eternal", themes: ["burn", "landfall"] },

  // Mill
  { name: "Bruvac the Grandiloquent", themes: ["mill"] },
  { name: "Fraying Sanity", themes: ["mill"] },
  { name: "Traumatize", themes: ["mill"] },
  { name: "Mind Grind", themes: ["mill"] },

  // Spells matter
  { name: "Storm-Kiln Artist", themes: ["spells_matter", "tokens"] },
  { name: "Talrand, Sky Summoner", themes: ["spells_matter", "tokens"] },
  { name: "Archmage Emeritus", roles: ["draw"], themes: ["spells_matter"] },
  { name: "Guttersnipe", themes: ["spells_matter", "burn"] },
  { name: "Torbran, Thane of Red Fell", themes: ["burn", "artifacts_matter"] },

  // +1/+1 counters
  { name: "Hardened Scales", themes: ["plus_one_counters"] },
  { name: "Corpsejack Menace", themes: ["plus_one_counters"] },
  { name: "Winding Constrictor", themes: ["plus_one_counters"] },
  { name: "Pir, Imaginative Rascal", themes: ["plus_one_counters"] },

  // Life
  { name: "Sanguine Bond", themes: ["life_gain_drain"] },
  { name: "Exquisite Blood", themes: ["life_gain_drain"] },
  { name: "Aetherflux Reservoir", themes: ["life_gain_drain"] },
  { name: "Vito, Thorn of the Dusk Rose", themes: ["life_gain_drain"] },
];

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const entries: CardOverrideEntry[] = [];
  const missing: string[] = [];
  const seenOracleIds = new Set<string>();

  for (const staple of STAPLES) {
    const card = await prisma.card.findFirst({
      where: { name: staple.name },
      select: { oracleId: true, name: true },
      orderBy: { isCommander: "desc" },
    });

    if (!card) {
      missing.push(staple.name);
      continue;
    }

    if (seenOracleIds.has(card.oracleId)) {
      const existing = entries.find((e) => e.oracle_id === card.oracleId);
      if (existing) {
        existing.roles = [...new Set([...(existing.roles ?? []), ...(staple.roles ?? [])])].sort() as CardOverrideEntry["roles"];
        existing.themes = [...new Set([...(existing.themes ?? []), ...(staple.themes ?? [])])].sort() as CardOverrideEntry["themes"];
        if (staple.note) existing.note = staple.note;
      }
      continue;
    }

    seenOracleIds.add(card.oracleId);
    entries.push({
      oracle_id: card.oracleId,
      roles: staple.roles,
      themes: staple.themes,
      note: staple.note,
    });
  }

  const output: CardOverridesFile = { version: 1, entries };
  const outPath = join(process.cwd(), "scripts/data/card-overrides.json");
  mkdirSync(join(process.cwd(), "scripts/data"), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Wrote ${entries.length} overrides to ${outPath}`);
  if (missing.length) {
    console.warn(`Missing from catalog (${missing.length}):`, missing.join(", "));
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
