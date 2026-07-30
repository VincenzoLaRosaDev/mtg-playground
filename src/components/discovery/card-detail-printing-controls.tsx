"use client";

import { useState, useTransition } from "react";

import { VersionPicker } from "@/components/discovery/version-picker";
import { VersionsBrowser } from "@/components/discovery/versions-browser";
import { loadOraclePrintings } from "@/lib/cards/actions";
import type {
  CardDetailView,
  OraclePrintingOption,
  PrintingFinish,
} from "@/lib/scryfall/card-printing";

type CardDetailPrintingControlsProps = {
  slug: string;
  oracleId: string;
  /** Active printing only until Versions / Version select requests the full list. */
  seedPrintings: OraclePrintingOption[];
  printingCount: number;
  /** True when `seedPrintings` is already the complete set (count ≤ 1). */
  printingsLoaded: boolean;
  selectedSet: string | null;
  selectedCn: string | null;
  selectedFinish: PrintingFinish | null;
  view: CardDetailView;
};

/**
 * PDP Printing section: Version select + Show all versions, then Finish.
 * Printings lazy-load on first open of Show all versions or Version select
 * (same pattern as CardDetailModal).
 */
export function CardDetailPrintingControls({
  slug,
  oracleId,
  seedPrintings,
  printingCount,
  printingsLoaded: initialLoaded,
  selectedSet,
  selectedCn,
  selectedFinish,
  view,
}: CardDetailPrintingControlsProps) {
  const [, startTransition] = useTransition();
  const [printings, setPrintings] =
    useState<OraclePrintingOption[]>(seedPrintings);
  const [printingsLoaded, setPrintingsLoaded] = useState(initialLoaded);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [syncedSeed, setSyncedSeed] = useState(seedPrintings);
  const [syncedLoaded, setSyncedLoaded] = useState(initialLoaded);

  if (
    seedPrintings !== syncedSeed ||
    initialLoaded !== syncedLoaded
  ) {
    setSyncedSeed(seedPrintings);
    setSyncedLoaded(initialLoaded);
    setPrintings(seedPrintings);
    setPrintingsLoaded(initialLoaded);
    setVersionsOpen(false);
  }

  async function ensurePrintingsLoaded(): Promise<OraclePrintingOption[]> {
    if (printingsLoaded) return printings;
    const all = await loadOraclePrintings(oracleId);
    setPrintings(all);
    setPrintingsLoaded(true);
    return all;
  }

  function handleVersionsOpenChange(openNext: boolean) {
    if (!openNext) {
      setVersionsOpen(false);
      return;
    }
    if (printingsLoaded) {
      setVersionsOpen(true);
      return;
    }
    // Defer sheet open until printings are ready (no skeleton).
    startTransition(() => {
      void ensurePrintingsLoaded().then(() => {
        setVersionsOpen(true);
      });
    });
  }

  return (
    <VersionPicker
      slug={slug}
      printings={printings}
      selectedSet={selectedSet}
      selectedCn={selectedCn}
      selectedFinish={selectedFinish}
      view={view}
      onNeedPrintings={() => {
        if (!printingsLoaded) {
          startTransition(() => {
            void ensurePrintingsLoaded();
          });
        }
      }}
      versionActions={
        <VersionsBrowser
          slug={slug}
          printings={printingsLoaded ? printings : []}
          printingCount={printingCount}
          selectedSet={selectedSet}
          selectedCn={selectedCn}
          selectedFinish={selectedFinish}
          view={view}
          open={versionsOpen}
          onOpenChange={handleVersionsOpenChange}
        />
      }
    />
  );
}
