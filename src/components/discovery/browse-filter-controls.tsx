"use client";

import { useId, type ReactNode } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  browseFilterLabelClassName,
  browseToolbarCmcFieldClassName,
  browseToolbarCmcPairClassName,
  browseToolbarPillGroupsClassName,
} from "@/components/discovery/browse-toolbar-shared";
import { MANA_COLOR_OPTIONS } from "@/lib/browse/color-identity-filter";
import { SET_RARITIES } from "@/lib/browse/rarity-filter";
import { ManaSymbol } from "@/components/mtg/mana-symbol";
import { RarityIcon } from "@/components/mtg/rarity-icon";
import type { ManaColor } from "@/lib/mtg/mana-types";
import { manaColorLabel } from "@/lib/mtg/mana-labels";
import type { SetRarity } from "@/lib/mtg/rarity-types";
import { rarityLabel } from "@/lib/mtg/rarity-labels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Sentinel for optional “any / all” options — SelectItem cannot use "". */
const BROWSE_SELECT_EMPTY = "__browse_select_empty__";

const browseSymbolToggleClassName =
  "size-auto min-w-0 rounded-full border-0 bg-transparent p-1 opacity-85 shadow-none hover:bg-transparent hover:opacity-100 aria-pressed:bg-transparent aria-pressed:opacity-100 aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-1 aria-pressed:ring-offset-background data-pressed:bg-transparent data-pressed:opacity-100 data-pressed:ring-2 data-pressed:ring-primary data-pressed:ring-offset-1 data-pressed:ring-offset-background data-pressed:shadow-none";

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
  htmlFor?: string;
  className?: string;
  children: ReactNode;
};

/** Label + control wrapper — same layout for search, select, and text fields. */
export function BrowseToolbarField({
  label,
  htmlFor,
  className,
  children,
}: BrowseToolbarFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor={htmlFor} className={browseFilterLabelClassName}>
        {label}
      </Label>
      {children}
    </div>
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
      <ToggleGroup
        multiple
        value={colors}
        onValueChange={onChange}
        spacing={2}
        className="flex-wrap"
        aria-label={title}
      >
        {MANA_COLOR_OPTIONS.map((color) => {
          const manaColor = color as ManaColor;

          return (
            <ToggleGroupItem
              key={color}
              value={color}
              aria-label={manaColorLabel(manaColor)}
              title={manaColorLabel(manaColor)}
              className={browseSymbolToggleClassName}
            >
              <ManaSymbol color={manaColor} size="md" />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
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
      <ToggleGroup
        multiple
        value={rarities}
        onValueChange={onChange}
        spacing={2}
        className="flex-wrap"
        aria-label="Rarity"
      >
        {SET_RARITIES.map((rarity) => {
          const setRarity = rarity as SetRarity;

          return (
            <ToggleGroupItem
              key={rarity}
              value={rarity}
              aria-label={rarityLabel(setRarity)}
              title={rarityLabel(setRarity)}
              className={browseSymbolToggleClassName}
            >
              <RarityIcon rarity={setRarity} size="md" />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
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
    <Toggle
      pressed={selected}
      onPressedChange={() => onClick()}
      variant="outline"
      size="sm"
      className="rounded-full px-2.5 text-xs data-pressed:bg-primary data-pressed:text-primary-foreground data-pressed:hover:bg-primary/80 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
    >
      {label}
    </Toggle>
  );
}

type BrowseFilterPillRowProps = {
  children: ReactNode;
};

export function BrowseFilterPillRow({ children }: BrowseFilterPillRowProps) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function BrowseToolbarPillGroups({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(browseToolbarPillGroupsClassName, className)}>{children}</div>;
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
  const id = useId();
  const items = options.map((option) => ({
    value: option.value === "" ? BROWSE_SELECT_EMPTY : option.value,
    label: option.label,
  }));
  const selectValue = value === "" ? BROWSE_SELECT_EMPTY : value;

  return (
    <BrowseToolbarField label={label} htmlFor={id} className={className}>
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next == null) return;
          onChange(next === BROWSE_SELECT_EMPTY ? "" : next);
        }}
        items={items}
      >
        <SelectTrigger id={id} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
  typePlaceholder = "e.g. Instant, Elf",
  inline = false,
}: BrowseCatalogFilterFieldsProps) {
  const typeId = useId();
  const cmcMinId = useId();
  const cmcMaxId = useId();

  const typeField = (
    <BrowseToolbarField label="Type contains" htmlFor={typeId}>
      <Input
        id={typeId}
        type="text"
        value={values.typeContains}
        onChange={(event) => onChange({ typeContains: event.target.value })}
        placeholder={typePlaceholder}
      />
    </BrowseToolbarField>
  );

  const cmcPair = (
    <div className={browseToolbarCmcPairClassName}>
      <BrowseToolbarField label="CMC min" htmlFor={cmcMinId} className={browseToolbarCmcFieldClassName}>
        <Input
          id={cmcMinId}
          type="number"
          min={0}
          step={1}
          value={values.cmcMin}
          onChange={(event) => onChange({ cmcMin: event.target.value })}
          className="px-1.5 text-center tabular-nums"
        />
      </BrowseToolbarField>

      <BrowseToolbarField label="CMC max" htmlFor={cmcMaxId} className={browseToolbarCmcFieldClassName}>
        <Input
          id={cmcMaxId}
          type="number"
          min={0}
          step={1}
          value={values.cmcMax}
          onChange={(event) => onChange({ cmcMax: event.target.value })}
          className="px-1.5 text-center tabular-nums"
        />
      </BrowseToolbarField>
    </div>
  );

  if (inline) {
    return (
      <>
        {typeField}
        {cmcPair}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      {typeField}
      {cmcPair}
    </div>
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
  const id = useId();

  return (
    <BrowseToolbarField label={label} htmlFor={id} className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
    </BrowseToolbarField>
  );
}
