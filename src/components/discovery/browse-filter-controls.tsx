"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  browseFilterLabelClassName,
  browseToolbarCmcFieldClassName,
  browseToolbarCmcInputClassName,
  browseToolbarInputClassName,
  browseToolbarPillGroupsClassName,
} from "@/components/discovery/browse-toolbar-shared";
import {
  MANA_COLOR_OPTIONS,
  toggleManaColorSelection,
} from "@/lib/browse/color-identity-filter";
import {
  SET_RARITIES,
  toggleRaritySelection,
} from "@/lib/browse/rarity-filter";
import { ManaSymbol } from "@/components/mtg/mana-symbol";
import { RarityIcon } from "@/components/mtg/rarity-icon";
import type { ManaColor } from "@/lib/mtg/mana-types";
import { manaColorLabel } from "@/lib/mtg/mana-labels";
import type { SetRarity } from "@/lib/mtg/rarity-types";
import { rarityLabel } from "@/lib/mtg/rarity-labels";

export const browseFilterPillBaseClassName =
  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";

export function browseFilterPillClassName(selected: boolean): string {
  return selected
    ? cn(browseFilterPillBaseClassName, "bg-primary text-primary-foreground shadow-sm")
    : cn(
        browseFilterPillBaseClassName,
        "border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      );
}

export function browseManaPillClassName(selected: boolean): string {
  return selected
    ? "rounded-full p-1 ring-2 ring-primary ring-offset-1 ring-offset-background"
    : "rounded-full p-1 opacity-85 hover:opacity-100";
}

export function browseRarityPillClassName(selected: boolean): string {
  return browseManaPillClassName(selected);
}

type BrowseFilterSectionProps = {
  title: string;
  children: ReactNode;
};

export function BrowseFilterSection({ title, children }: BrowseFilterSectionProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <span className={browseFilterLabelClassName}>{title}</span>
      {children}
    </div>
  );
}

type BrowseToolbarFieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

/** Label + control wrapper — same layout for search, select, and text fields. */
export function BrowseToolbarField({ label, className, children }: BrowseToolbarFieldProps) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className={browseFilterLabelClassName}>{label}</span>
      {children}
    </label>
  );
}

type BrowseColorPillGroupProps = {
  colors: string[];
  onChange: (colors: string[]) => void;
  title?: string;
};

export function BrowseColorPillGroup({
  colors,
  onChange,
  title = "Color identity",
}: BrowseColorPillGroupProps) {
  return (
    <BrowseFilterSection title={title}>
      <div className="flex flex-wrap gap-2">
        {MANA_COLOR_OPTIONS.map((color) => {
          const selected = colors.includes(color);
          const manaColor = color as ManaColor;

          return (
            <button
              key={color}
              type="button"
              aria-label={manaColorLabel(manaColor)}
              aria-pressed={selected}
              title={manaColorLabel(manaColor)}
              onClick={() => onChange(toggleManaColorSelection(colors, color))}
              className={browseManaPillClassName(selected)}
            >
              <ManaSymbol color={manaColor} size="md" />
            </button>
          );
        })}
      </div>
    </BrowseFilterSection>
  );
}

type BrowseRarityPillGroupProps = {
  rarities: string[];
  onChange: (rarities: string[]) => void;
};

export function BrowseRarityPillGroup({ rarities, onChange }: BrowseRarityPillGroupProps) {
  return (
    <BrowseFilterSection title="Rarity">
      <div className="flex flex-wrap gap-2">
        {SET_RARITIES.map((rarity) => {
          const selected = rarities.includes(rarity);
          const setRarity = rarity as SetRarity;

          return (
            <button
              key={rarity}
              type="button"
              aria-label={rarityLabel(setRarity)}
              aria-pressed={selected}
              title={rarityLabel(setRarity)}
              onClick={() => onChange(toggleRaritySelection(rarities, rarity))}
              className={browseRarityPillClassName(selected)}
            >
              <RarityIcon rarity={setRarity} size="md" />
            </button>
          );
        })}
      </div>
    </BrowseFilterSection>
  );
}

type BrowseFilterPillProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function BrowseFilterPill({ label, selected, onClick }: BrowseFilterPillProps) {
  return (
    <button type="button" onClick={onClick} className={browseFilterPillClassName(selected)}>
      {label}
    </button>
  );
}

type BrowseFilterPillRowProps = {
  children: ReactNode;
};

export function BrowseFilterPillRow({ children }: BrowseFilterPillRowProps) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function BrowseToolbarPillGroups({ children }: { children: ReactNode }) {
  return <div className={browseToolbarPillGroupsClassName}>{children}</div>;
}

type BrowseSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  className?: string;
};

export function BrowseSelectField({
  label,
  value,
  onChange,
  options,
  className,
}: BrowseSelectFieldProps) {
  return (
    <BrowseToolbarField label={label} className={className}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={browseToolbarInputClassName}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </BrowseToolbarField>
  );
}

type BrowseCatalogFieldFilters = {
  typeContains: string;
  cmcMin: string;
  cmcMax: string;
};

type BrowseCatalogFilterFieldsProps = {
  values: BrowseCatalogFieldFilters;
  onChange: (patch: Partial<BrowseCatalogFieldFilters>) => void;
  typePlaceholder?: string;
  /** When true, fields participate in a parent dense grid (no inner wrapper). */
  inline?: boolean;
};

export function BrowseCatalogFilterFields({
  values,
  onChange,
  typePlaceholder = "e.g. Instant, Artifact",
  inline = false,
}: BrowseCatalogFilterFieldsProps) {
  const fields = (
    <>
      <BrowseToolbarField label="Type contains">
        <input
          type="text"
          value={values.typeContains}
          onChange={(event) => onChange({ typeContains: event.target.value })}
          placeholder={typePlaceholder}
          className={browseToolbarInputClassName}
        />
      </BrowseToolbarField>

      <BrowseToolbarField label="CMC min" className={browseToolbarCmcFieldClassName}>
        <input
          type="number"
          min={0}
          step={1}
          value={values.cmcMin}
          onChange={(event) => onChange({ cmcMin: event.target.value })}
          className={browseToolbarCmcInputClassName}
        />
      </BrowseToolbarField>

      <BrowseToolbarField label="CMC max" className={browseToolbarCmcFieldClassName}>
        <input
          type="number"
          min={0}
          step={1}
          value={values.cmcMax}
          onChange={(event) => onChange({ cmcMax: event.target.value })}
          className={browseToolbarCmcInputClassName}
        />
      </BrowseToolbarField>
    </>
  );

  if (inline) {
    return fields;
  }

  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{fields}</div>
  );
}

type BrowseSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
};

export function BrowseSearchField({
  value,
  onChange,
  label,
  placeholder = "Min. 2 characters...",
  className,
}: BrowseSearchFieldProps) {
  return (
    <BrowseToolbarField label={label} className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(browseToolbarInputClassName, "pl-8")}
        />
      </div>
    </BrowseToolbarField>
  );
}
