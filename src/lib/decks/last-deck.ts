const STORAGE_KEY = "mtgplayground.lastDeckId";

/** Last deck visited/edited — default target for Add to deck outside a deck page. */
export function readLastDeckId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export function writeLastDeckId(deckId: string): void {
  const id = deckId.trim();
  if (!id) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}

export function pickDefaultDeckId(input: {
  deckIds: readonly string[];
  /** Current deck editor page, when set. */
  workspaceDeckId?: string | null;
  lastDeckId?: string | null;
}): string | null {
  const { deckIds, workspaceDeckId, lastDeckId } = input;
  if (deckIds.length === 0) return null;
  if (workspaceDeckId && deckIds.includes(workspaceDeckId)) {
    return workspaceDeckId;
  }
  if (lastDeckId && deckIds.includes(lastDeckId)) {
    return lastDeckId;
  }
  return deckIds[0] ?? null;
}
