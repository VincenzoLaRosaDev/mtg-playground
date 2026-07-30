"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  BrowseSelectField,
  BrowseFilterSection,
} from "@/components/discovery/browse-filter-controls";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  buildCardVersionHref,
  parsePrintingFinish,
  parsePrintingOptionValue,
  printingOptionLabel,
  printingOptionValue,
  resolveActiveFinish,
  type CardDetailView,
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import {
  DETAIL_FINISH_TOGGLE_CLASS,
  DETAIL_PRINTING_CONTROLS_CLASS,
  DETAIL_PRINTING_FINISH_COL_CLASS,
  DETAIL_PRINTING_VERSION_COL_CLASS,
  DETAIL_PRINTING_VERSION_GROUP_CLASS,
  DETAIL_VERSION_SELECT_CLASS,
} from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

export type PrintingSelection = {
  set: string;
  cn: string;
  finish: PrintingFinish | null;
};

type VersionPickerProps = {
  slug: string;
  printings: OraclePrintingOption[];
  selectedSet: string | null;
  selectedCn: string | null;
  selectedFinish: PrintingFinish | null;
  /** Preserve As card / As commander list view across version changes (URL mode). */
  view?: CardDetailView | null;
  /**
   * When set, selection calls this instead of navigating to `/cards/{slug}?…`.
   * Use in CardDetailModal; omit on the public PDP.
   */
  onSelectPrinting?: (selection: PrintingSelection) => void;
  /** Lazy printings: fire when the Version select is interacted with. */
  onNeedPrintings?: () => void;
  /**
   * Trailing control beside Version (typically VersionsBrowser “Show all versions”).
   * Wraps under the select when the pair runs out of horizontal room.
   */
  versionActions?: ReactNode;
};

const FINISH_LABELS: Record<PrintingFinish, string> = {
  nonfoil: "Nonfoil",
  foil: "Foil",
  etched: "Etched",
};

/**
 * Shared Printing chrome (PDP + modal): Version + Show all (flex wrap pair);
 * Finish shares a Status|Roles|Themes-style column grid when present.
 */
export function VersionPicker({
  slug,
  printings,
  selectedSet,
  selectedCn,
  selectedFinish,
  view = null,
  onSelectPrinting,
  onNeedPrintings,
  versionActions,
}: VersionPickerProps) {
  const router = useRouter();

  if (printings.length === 0) {
    return null;
  }

  const selectedPrinting =
    selectedSet && selectedCn
      ? printings.find(
          (row) =>
            row.setCode === selectedSet && row.collectorNumber === selectedCn,
        )
      : selectedSet
        ? printings.find((row) => row.setCode === selectedSet)
        : null;

  const activePrinting = selectedPrinting ?? printings[0]!;
  const selectedValue = printingOptionValue(activePrinting);

  const finishOptions = activePrinting.finishes.filter(
    (finish): finish is PrintingFinish =>
      finish === "nonfoil" || finish === "foil" || finish === "etched",
  );

  const activeFinish = resolveActiveFinish(
    activePrinting.finishes,
    selectedFinish,
  );
  const showFinish = finishOptions.length > 1;

  function applySelection(next: {
    set?: string | null;
    cn?: string | null;
    finish?: string | null;
  }) {
    const set = next.set?.trim() || activePrinting.setCode;
    const cn = next.cn?.trim() || activePrinting.collectorNumber;
    const finish = parsePrintingFinish(next.finish);

    if (onSelectPrinting) {
      onSelectPrinting({
        set,
        cn,
        finish: finish && finish !== "nonfoil" ? finish : null,
      });
      return;
    }

    router.push(
      buildCardVersionHref(slug, {
        set,
        cn,
        finish,
        view: view === "commander" ? "commander" : null,
      }),
      { scroll: false },
    );
  }

  const versionBlock = (
    <div className={DETAIL_PRINTING_VERSION_GROUP_CLASS}>
      <div
        onPointerDown={() => onNeedPrintings?.()}
        className={cn(
          "min-w-0 max-w-full",
          versionActions ? "min-w-[min(100%,12rem)] flex-1" : "w-full",
        )}
      >
        <BrowseSelectField
          label="Version"
          className={DETAIL_VERSION_SELECT_CLASS}
          value={selectedValue}
          onChange={(value) => {
            const parsed = parsePrintingOptionValue(value);
            if (!parsed) return;
            const option = printings.find(
              (row) =>
                row.setCode === parsed.setCode &&
                row.collectorNumber === parsed.collectorNumber,
            );
            const finish =
              selectedFinish && option?.finishes.includes(selectedFinish)
                ? selectedFinish
                : null;
            applySelection({
              set: parsed.setCode,
              cn: parsed.collectorNumber,
              finish,
            });
          }}
          options={printings.map((row) => ({
            value: printingOptionValue(row),
            label: `${printingOptionLabel(row)} · ${row.setName}`,
          }))}
        />
      </div>
      {versionActions ? (
        <div className="min-w-0 w-full shrink-0 sm:w-auto">{versionActions}</div>
      ) : null}
    </div>
  );

  if (!showFinish) {
    return versionBlock;
  }

  return (
    <div className={DETAIL_PRINTING_CONTROLS_CLASS}>
      <div className={DETAIL_PRINTING_VERSION_COL_CLASS}>{versionBlock}</div>
      <BrowseFilterSection
        title="Finish"
        className={cn(DETAIL_PRINTING_FINISH_COL_CLASS, DETAIL_FINISH_TOGGLE_CLASS)}
      >
        <ToggleGroup
          value={[activeFinish]}
          onValueChange={(values) => {
            const next = parsePrintingFinish(values[0]);
            if (!next) return;
            applySelection({
              set: activePrinting.setCode,
              cn: activePrinting.collectorNumber,
              finish: next === "nonfoil" ? null : next,
            });
          }}
          variant="outline"
          size="default"
          className="justify-start"
          aria-label="Printing finish"
        >
          {finishOptions.map((finish) => (
            <ToggleGroupItem key={finish} value={finish}>
              {FINISH_LABELS[finish]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </BrowseFilterSection>
    </div>
  );
}
