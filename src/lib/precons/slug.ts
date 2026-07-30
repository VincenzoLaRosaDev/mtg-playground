import { toCardSlug } from "@/lib/scryfall/card-utils";

/** Stable unique slug for a precon (name + set code). */
export function toPreconSlug(name: string, code: string): string {
  const base = toCardSlug(name);
  const set = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!base) return set || "precon";
  if (!set) return base;
  return `${base}-${set}`;
}
