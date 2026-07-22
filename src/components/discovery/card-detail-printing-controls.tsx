"use client";

import { VersionPicker } from "@/components/discovery/version-picker";
import { VersionsBrowser } from "@/components/discovery/versions-browser";
import type {
  CardDetailView,
  OraclePrintingOption,
  PrintingFinish,
} from "@/lib/scryfall/card-printing";

type CardDetailPrintingControlsProps = {
  slug: string;
  printings: OraclePrintingOption[];
  selectedSet: string | null;
  selectedCn: string | null;
  selectedFinish: PrintingFinish | null;
  view: CardDetailView;
};

/** Version select + optional “Show all versions” sheet (client boundary). */
export function CardDetailPrintingControls({
  slug,
  printings,
  selectedSet,
  selectedCn,
  selectedFinish,
  view,
}: CardDetailPrintingControlsProps) {
  return (
    <div>
      <VersionPicker
        slug={slug}
        printings={printings}
        selectedSet={selectedSet}
        selectedCn={selectedCn}
        selectedFinish={selectedFinish}
        view={view}
        layout="overview"
      />
      <VersionsBrowser
        slug={slug}
        printings={printings}
        selectedSet={selectedSet}
        selectedCn={selectedCn}
        selectedFinish={selectedFinish}
        view={view}
      />
    </div>
  );
}
