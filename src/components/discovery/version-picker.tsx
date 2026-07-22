"use client";

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
import { DETAIL_OVERVIEW_CONTROLS_GRID_CLASS } from "@/lib/ui/layout";
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
  /** Overview panel: Version + Finish share a responsive row. */
  layout?: "stack" | "overview";
  /**
   * When set, selection calls this instead of navigating to `/cards/{slug}?…`.
   * Use in deck/collection embeds; omit on the public PDP.
   */
  onSelectPrinting?: (selection: PrintingSelection) => void;
};

const FINISH_LABELS: Record<PrintingFinish, string> = {
  nonfoil: "Nonfoil",
  foil: "Foil",
  etched: "Etched",
};

export function VersionPicker({
  slug,
  printings,
  selectedSet,
  selectedCn,
  selectedFinish,
  view = null,
  layout = "stack",
  onSelectPrinting,
}: VersionPickerProps) {
  const router = useRouter();

  if (printings.length === 0) {
    return null;
  }

  const selectedPrinting =
    selectedSet && selectedCn
      ? printings.find(
          (row) => row.setCode === selectedSet && row.collectorNumber === selectedCn,
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

  const activeFinish = resolveActiveFinish(activePrinting.finishes, selectedFinish);
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
    );
  }

  const versionField = (
    <BrowseSelectField
      label="Version"
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
  );

  const finishField = showFinish ? (
    <BrowseFilterSection title="Finish">
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
        spacing={0}
        className={cn("flex w-full", layout === "overview" && "min-h-8")}
        aria-label="Printing finish"
      >
        {finishOptions.map((finish) => (
          <ToggleGroupItem
            key={finish}
            value={finish}
            className="min-w-0 flex-1 justify-center px-2 data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            {FINISH_LABELS[finish]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </BrowseFilterSection>
  ) : null;

  if (layout === "overview") {
    return (
      <div
        className={cn(
          showFinish ? DETAIL_OVERVIEW_CONTROLS_GRID_CLASS : "grid grid-cols-1",
        )}
      >
        {versionField}
        {finishField}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versionField}
      {finishField}
    </div>
  );
}
