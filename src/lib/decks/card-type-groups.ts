/**
 * Goldfish-style primary type buckets for deck builder presentation.
 * Uses the front face of DFC type lines (text before `//`).
 */

export type DeckCardTypeGroupId =
  | "creature"
  | "planeswalker"
  | "instant"
  | "sorcery"
  | "artifact"
  | "enchantment"
  | "battle"
  | "land"
  | "other";

export type DeckCardTypeGroup<T> = {
  id: DeckCardTypeGroupId;
  label: string;
  /** Sum of `quantity` in the group. */
  totalQuantity: number;
  cards: T[];
};

const GROUP_META: {
  id: DeckCardTypeGroupId;
  label: string;
}[] = [
  { id: "creature", label: "Creature" },
  { id: "planeswalker", label: "Planeswalker" },
  { id: "instant", label: "Instant" },
  { id: "sorcery", label: "Sorcery" },
  { id: "artifact", label: "Artifact" },
  { id: "enchantment", label: "Enchantment" },
  { id: "battle", label: "Battle" },
  { id: "land", label: "Land" },
  { id: "other", label: "Other" },
];

const GROUP_RANK = Object.fromEntries(
  GROUP_META.map((row, index) => [row.id, index]),
) as Record<DeckCardTypeGroupId, number>;

const GROUP_LABEL = Object.fromEntries(
  GROUP_META.map((row) => [row.id, row.label]),
) as Record<DeckCardTypeGroupId, string>;

/** Front-face type words (before em/en dash subtypes). */
export function typeLineTypeWords(typeLine: string): string {
  const front = (typeLine.split("//")[0] ?? typeLine).trim();
  const typePart = front.split(/\s+[—–-]\s+/)[0] ?? front;
  return typePart.trim();
}

/**
 * First matching bucket wins (Creature before Artifact so
 * “Artifact Creature” → Creature).
 */
export function primaryTypeGroupId(typeLine: string): DeckCardTypeGroupId {
  const words = typeLineTypeWords(typeLine);
  if (/\bCreature\b/i.test(words)) return "creature";
  if (/\bPlaneswalker\b/i.test(words)) return "planeswalker";
  if (/\bInstant\b/i.test(words)) return "instant";
  if (/\bSorcery\b/i.test(words)) return "sorcery";
  if (/\bArtifact\b/i.test(words)) return "artifact";
  if (/\bEnchantment\b/i.test(words)) return "enchantment";
  if (/\bBattle\b/i.test(words)) return "battle";
  if (/\bLand\b/i.test(words)) return "land";
  return "other";
}

export function typeGroupRank(id: DeckCardTypeGroupId): number {
  return GROUP_RANK[id] ?? GROUP_RANK.other;
}

export function typeGroupLabel(id: DeckCardTypeGroupId): string {
  return GROUP_LABEL[id] ?? GROUP_LABEL.other;
}

export type DeckCardSortable = {
  typeLine: string;
  cmc: number;
  name: string;
  quantity: number;
};

export function compareByCmcThenName(
  a: Pick<DeckCardSortable, "cmc" | "name">,
  b: Pick<DeckCardSortable, "cmc" | "name">,
): number {
  if (a.cmc !== b.cmc) return a.cmc - b.cmc;
  return a.name.localeCompare(b.name);
}

/** Group + sort cards for Main / Side presentation. Empty groups omitted. */
export function groupDeckCardsByType<T extends DeckCardSortable>(
  cards: readonly T[],
): DeckCardTypeGroup<T>[] {
  const buckets = new Map<DeckCardTypeGroupId, T[]>();
  for (const card of cards) {
    const id = primaryTypeGroupId(card.typeLine);
    const list = buckets.get(id);
    if (list) list.push(card);
    else buckets.set(id, [card]);
  }

  const groups: DeckCardTypeGroup<T>[] = [];
  for (const meta of GROUP_META) {
    const list = buckets.get(meta.id);
    if (!list?.length) continue;
    list.sort(compareByCmcThenName);
    groups.push({
      id: meta.id,
      label: meta.label,
      totalQuantity: list.reduce((sum, row) => sum + row.quantity, 0),
      cards: list,
    });
  }
  return groups;
}

/**
 * Stable display order: type rank → CMC → name
 * (board ordering is applied by the caller).
 */
export function compareDeckCardsByTypeThenCmc(
  a: Pick<DeckCardSortable, "typeLine" | "cmc" | "name">,
  b: Pick<DeckCardSortable, "typeLine" | "cmc" | "name">,
): number {
  const tr =
    typeGroupRank(primaryTypeGroupId(a.typeLine)) -
    typeGroupRank(primaryTypeGroupId(b.typeLine));
  if (tr !== 0) return tr;
  return compareByCmcThenName(a, b);
}
