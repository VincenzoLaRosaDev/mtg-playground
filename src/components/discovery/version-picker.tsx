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
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";

type VersionPickerProps = {
  slug: string;
  printings: OraclePrintingOption[];
  selectedSet: string | null;
  selectedCn: string | null;
  selectedFinish: PrintingFinish | null;
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
}: VersionPickerProps) {
  const router = useRouter();

  if (printings.length === 0) {
    return null;
  }

  const selectedValue =
    selectedSet && selectedCn
      ? `${selectedSet}|${selectedCn}`
      : selectedSet
        ? printingOptionValue(
            printings.find((row) => row.setCode === selectedSet) ?? printings[0]!,
          )
        : "default";

  const selectedPrinting =
    selectedSet && selectedCn
      ? printings.find(
          (row) => row.setCode === selectedSet && row.collectorNumber === selectedCn,
        )
      : selectedSet
        ? printings.find((row) => row.setCode === selectedSet)
        : null;

  const finishOptions = (selectedPrinting?.finishes ?? []).filter(
    (finish): finish is PrintingFinish =>
      finish === "nonfoil" || finish === "foil" || finish === "etched",
  );

  const activeFinish: PrintingFinish =
    selectedFinish && finishOptions.includes(selectedFinish)
      ? selectedFinish
      : finishOptions.includes("nonfoil")
        ? "nonfoil"
        : (finishOptions[0] ?? "nonfoil");

  function navigate(next: {
    set?: string | null;
    cn?: string | null;
    finish?: string | null;
  }) {
    router.push(buildCardVersionHref(slug, next));
  }

  return (
    <div className="space-y-3">
      <BrowseSelectField
        label="Version"
        value={selectedValue}
        onChange={(value) => {
          if (value === "default") {
            navigate({});
            return;
          }
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
          navigate({
            set: parsed.setCode,
            cn: parsed.collectorNumber,
            finish,
          });
        }}
        options={[
          { value: "default", label: "Catalog default" },
          ...printings.map((row) => ({
            value: printingOptionValue(row),
            label: `${printingOptionLabel(row)} · ${row.setName}`,
          })),
        ]}
      />

      {finishOptions.length > 1 ? (
        <BrowseFilterSection title="Finish">
          <ToggleGroup
            value={[activeFinish]}
            onValueChange={(values) => {
              const next = parsePrintingFinish(values[0]);
              if (!next || !selectedPrinting) return;
              navigate({
                set: selectedPrinting.setCode,
                cn: selectedPrinting.collectorNumber,
                finish: next === "nonfoil" ? null : next,
              });
            }}
            variant="outline"
            spacing={0}
            className="flex flex-wrap"
            aria-label="Printing finish"
          >
            {finishOptions.map((finish) => (
              <ToggleGroupItem
                key={finish}
                value={finish}
                className="px-3 data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                {FINISH_LABELS[finish]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </BrowseFilterSection>
      ) : null}
    </div>
  );
}
