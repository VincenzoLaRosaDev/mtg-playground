import { readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  CardOverrideEntry,
  CardOverridesFile,
  FunctionalRole,
  SynergyTheme,
} from "@/lib/classification/types";
import { isFunctionalRole, isSynergyTheme, uniqueSorted } from "@/lib/classification/types";

const DEFAULT_PATH = join(process.cwd(), "scripts/data/card-overrides.json");

function validateEntry(entry: CardOverrideEntry, index: number): CardOverrideEntry {
  if (!entry.oracle_id || typeof entry.oracle_id !== "string") {
    throw new Error(`card-overrides.json entry ${index}: missing oracle_id`);
  }

  const roles = (entry.roles ?? []).filter((role): role is FunctionalRole => {
    if (!isFunctionalRole(role)) {
      console.warn(`card-overrides.json: unknown role "${role}" on ${entry.oracle_id}`);
      return false;
    }
    return true;
  });

  const themes = (entry.themes ?? []).filter((theme): theme is SynergyTheme => {
    if (!isSynergyTheme(theme)) {
      console.warn(`card-overrides.json: unknown theme "${theme}" on ${entry.oracle_id}`);
      return false;
    }
    return true;
  });

  return {
    oracle_id: entry.oracle_id,
    roles: uniqueSorted(roles),
    themes: uniqueSorted(themes),
    note: entry.note,
  };
}

export function loadCardOverrides(filePath = DEFAULT_PATH): Map<string, CardOverrideEntry> {
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as CardOverridesFile;

  if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
    throw new Error("card-overrides.json must be { version: 1, entries: [...] }");
  }

  const map = new Map<string, CardOverrideEntry>();

  parsed.entries.forEach((entry, index) => {
    const validated = validateEntry(entry, index);
    map.set(validated.oracle_id, validated);
  });

  return map;
}
