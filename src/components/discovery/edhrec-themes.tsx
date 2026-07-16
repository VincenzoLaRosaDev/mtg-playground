"use client";

import { useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { splitTagCounts } from "@/lib/edhrec/cardlists";
import {
  DETAIL_SECTION_IDS,
  DETAIL_SECTION_HEADING_CLASS,
  DETAIL_SECTION_SCROLL_MARGIN,
  detailSectionPanelClass,
} from "@/lib/ui/detail-section-nav";

type EdhrecThemesProps = {
  tagCounts: Record<string, number>;
  uniqueToView?: boolean;
};

type ThemeView = "themes" | "kindred";

export function EdhrecThemes({ tagCounts, uniqueToView = true }: EdhrecThemesProps) {
  const { themes, kindred } = splitTagCounts(tagCounts);
  const hasKindred = kindred.length > 0;
  const [view, setView] = useState<ThemeView>("themes");

  const activeItems = view === "kindred" ? kindred : themes;

  if (themes.length === 0 && kindred.length === 0) {
    return null;
  }

  return (
    <section
      id={DETAIL_SECTION_IDS.deckThemes}
      className={`${DETAIL_SECTION_SCROLL_MARGIN} ${detailSectionPanelClass(uniqueToView)}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={DETAIL_SECTION_HEADING_CLASS}>Deck themes</h2>

        {hasKindred ? (
          <ToggleGroup
            value={[view]}
            onValueChange={(next) => {
              const selected = next[0];
              if (selected === "themes" || selected === "kindred") {
                setView(selected);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Theme category"
          >
            <ToggleGroupItem
              value="themes"
              className="px-3 text-xs capitalize data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              Themes
            </ToggleGroupItem>
            <ToggleGroupItem
              value="kindred"
              className="px-3 text-xs capitalize data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              Kindred
            </ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {activeItems.slice(0, 12).map(({ name, count }) => (
          <li
            key={name}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
          >
            {name} · {count.toLocaleString()}
          </li>
        ))}
      </ul>

      {activeItems.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No {view === "kindred" ? "kindred" : "theme"} tags for this commander.
        </p>
      ) : null}
    </section>
  );
}
