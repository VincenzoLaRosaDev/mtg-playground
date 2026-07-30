"use client";

import { LayoutGrid, List } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type DeckEditorViewMode = "grid" | "list";

const DECK_EDITOR_VIEW_KEY = "mtgplayground.deckEditorView";
const PRECON_DECK_VIEW_KEY = "mtgplayground.preconDeckView";

function createPersistedViewStore(storageKey: string) {
  const listeners = new Set<() => void>();

  function read(): DeckEditorViewMode {
    if (typeof window === "undefined") return "list";
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === "list" || raw === "grid") return raw;
    } catch {
      /* private mode */
    }
    return "list";
  }

  function write(view: DeckEditorViewMode): void {
    try {
      window.localStorage.setItem(storageKey, view);
    } catch {
      /* private mode */
    }
  }

  function subscribe(onStoreChange: () => void) {
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }

  function getServerSnapshot(): DeckEditorViewMode {
    return "list";
  }

  return function usePersistedDeckView(): [
    DeckEditorViewMode,
    (view: DeckEditorViewMode) => void,
  ] {
    const view = useSyncExternalStore(subscribe, read, getServerSnapshot);

    const update = useCallback((next: DeckEditorViewMode) => {
      write(next);
      listeners.forEach((listener) => listener());
    }, []);

    return [view, update];
  };
}

type DeckViewToggleProps = {
  value: DeckEditorViewMode;
  onChange: (view: DeckEditorViewMode) => void;
};

/** Grid vs Goldfish-style list presentation (deck editor / precon detail). */
export function DeckViewToggle({ value, onChange }: DeckViewToggleProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = values[0];
        if (next !== "grid" && next !== "list") return;
        if (next === value) return;
        onChange(next);
      }}
      variant="outline"
      size="sm"
      aria-label="Deck card layout"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid view">
        <LayoutGrid className="size-3.5" aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" title="List view">
        <List className="size-3.5" aria-hidden />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** Deck editor List/Grid preference (`mtgplayground.deckEditorView`). */
export const useDeckEditorView = createPersistedViewStore(DECK_EDITOR_VIEW_KEY);

/** Precon detail List/Grid preference (`mtgplayground.preconDeckView`) — independent of deck editor. */
export const usePreconDeckView = createPersistedViewStore(PRECON_DECK_VIEW_KEY);
