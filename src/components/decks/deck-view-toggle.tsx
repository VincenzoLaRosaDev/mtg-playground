"use client";

import { LayoutGrid, List } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type DeckEditorViewMode = "grid" | "list";

const STORAGE_KEY = "mtgplayground.deckEditorView";

function readDeckEditorView(): DeckEditorViewMode {
  if (typeof window === "undefined") return "list";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "list" || raw === "grid") return raw;
  } catch {
    /* private mode */
  }
  return "list";
}

function writeDeckEditorView(view: DeckEditorViewMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* private mode */
  }
}

const viewListeners = new Set<() => void>();

function subscribeView(onStoreChange: () => void) {
  viewListeners.add(onStoreChange);
  return () => {
    viewListeners.delete(onStoreChange);
  };
}

function getServerView(): DeckEditorViewMode {
  return "list";
}

type DeckViewToggleProps = {
  value: DeckEditorViewMode;
  onChange: (view: DeckEditorViewMode) => void;
};

/** Grid (default) vs Goldfish-style list presentation for the deck editor. */
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

/** Client view mode with localStorage persistence (SSR-safe default: list). */
export function useDeckEditorView(): [
  DeckEditorViewMode,
  (view: DeckEditorViewMode) => void,
] {
  const view = useSyncExternalStore(
    subscribeView,
    readDeckEditorView,
    getServerView,
  );

  const update = useCallback((next: DeckEditorViewMode) => {
    writeDeckEditorView(next);
    viewListeners.forEach((listener) => listener());
  }, []);

  return [view, update];
}
