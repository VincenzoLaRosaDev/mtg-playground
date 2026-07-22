"use client";

import { useRouter } from "next/navigation";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  buildCardVersionHref,
  type CardDetailView,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import { DETAIL_VIEW_TOGGLE_CLASS } from "@/lib/ui/layout";

type CardDetailViewToggleProps = {
  slug: string;
  activeView: CardDetailView;
  setCode: string | null;
  collectorNumber: string | null;
  finish: PrintingFinish | null;
};

export function CardDetailViewToggle({
  slug,
  activeView,
  setCode,
  collectorNumber,
  finish,
}: CardDetailViewToggleProps) {
  const router = useRouter();

  const version = {
    set: setCode,
    cn: collectorNumber,
    finish: finish && finish !== "nonfoil" ? finish : null,
  };

  return (
    <ToggleGroup
      value={[activeView]}
      onValueChange={(values) => {
        const next = values[0];
        if (next !== "card" && next !== "commander") return;
        if (next === activeView) return;
        const href = buildCardVersionHref(slug, { ...version, view: next });
        router.push(href);
        // Drop leftover section hashes from the previous view (TOC anchors).
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", href);
        }
      }}
      variant="outline"
      spacing={0}
      size="lg"
      className={DETAIL_VIEW_TOGGLE_CLASS}
      aria-label="Detail list view"
    >
      <ToggleGroupItem
        value="card"
        className="h-11 min-w-0 flex-1 justify-center rounded-none px-4 text-sm font-medium first:rounded-l-lg last:rounded-r-lg data-pressed:bg-primary data-pressed:text-primary-foreground"
      >
        As card
      </ToggleGroupItem>
      <ToggleGroupItem
        value="commander"
        className="h-11 min-w-0 flex-1 justify-center rounded-none px-4 text-sm font-medium first:rounded-l-lg last:rounded-r-lg data-pressed:bg-primary data-pressed:text-primary-foreground"
      >
        As commander
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
