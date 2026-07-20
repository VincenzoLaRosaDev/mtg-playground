"use client";

import {
  BrowseCatalogFilterFields,
  BrowseColorPillGroup,
  BrowseFilterPill,
  BrowseFilterPillRow,
  BrowseFilterSection,
  BrowseRarityPillGroup,
  BrowseSearchField,
  BrowseSelectField,
  BrowseToolbarPillGroups,
} from "@/components/discovery/browse-filter-controls";
import { BrowseFilterPanel, BrowseFilterPanelRow } from "@/components/discovery/browse-filter-panel";
import { browseToolbarListGridClassName } from "@/components/discovery/browse-toolbar-shared";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { BrowseHubToolbarSnapshot } from "@/lib/browse/browse-defaults";
import {
  defaultCatalogOrder,
  defaultCatalogSort,
  getCatalogBrowseSortOptions,
  PRICE_BAND_OPTIONS,
  ROLE_FILTER_OPTIONS,
  THEME_FILTER_OPTIONS,
  type AllCardSort,
  type PriceBand,
} from "@/lib/browse/cards-shared";
import { appendCatalogFilterParams } from "@/lib/browse/catalog-filter-params";
import type { BrowseEntity } from "@/lib/browse/cards-params";
import { colorsToParam } from "@/lib/browse/color-identity-filter";

export type BrowseHubToolbarState = BrowseHubToolbarSnapshot;

type BrowseHubToolbarProps = {
  state: BrowseHubToolbarState;
  onChange: (patch: Partial<BrowseHubToolbarState>) => void;
};

export function BrowseHubToolbar({ state, onChange }: BrowseHubToolbarProps) {
  const sortOptions = getCatalogBrowseSortOptions();
  const showRarity = state.entity === "cards";

  return (
    <BrowseFilterPanel>
      <div className="mb-3">
        <BrowseFilterSection title="Browse">
          <ToggleGroup
            value={[state.entity]}
            onValueChange={(values) => {
              const next = values[0] as BrowseEntity | undefined;
              if (next === "cards" || next === "commanders") {
                onChange({ entity: next });
              }
            }}
            variant="outline"
            spacing={0}
            className="flex flex-wrap"
            aria-label="Browse entity"
          >
            <ToggleGroupItem
              value="cards"
              className="px-4 data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              Cards
            </ToggleGroupItem>
            <ToggleGroupItem
              value="commanders"
              className="px-4 data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              Commanders
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="mt-2 text-xs text-muted-foreground">
            Commanders is a legality filter — Inclusion rank is not “as commander” popularity.
          </p>
        </BrowseFilterSection>
      </div>

      <div className={browseToolbarListGridClassName}>
        <BrowseSearchField
          label="Search in list"
          value={state.query}
          onChange={(query) => onChange({ query })}
        />

        <BrowseSelectField
          label="Sort by"
          value={state.sort}
          onChange={(sort) => onChange({ sort: sort as AllCardSort })}
          options={sortOptions}
        />

        <BrowseCatalogFilterFields
          values={state}
          onChange={(patch) => onChange(patch)}
          inline
        />

        <BrowseSelectField
          label="Role"
          value={state.role}
          onChange={(role) => onChange({ role })}
          options={[{ value: "", label: "Any role" }, ...ROLE_FILTER_OPTIONS]}
        />

        <BrowseSelectField
          label="Theme"
          value={state.theme}
          onChange={(theme) => onChange({ theme })}
          options={[{ value: "", label: "Any theme" }, ...THEME_FILTER_OPTIONS]}
        />

        <BrowseSelectField
          label="Price band"
          value={state.priceBand}
          onChange={(priceBand) =>
            onChange({ priceBand: (priceBand as PriceBand | "") || "" })
          }
          options={[{ value: "", label: "Any price" }, ...PRICE_BAND_OPTIONS]}
        />
      </div>

      <BrowseFilterPanelRow
        sortOrder={{ order: state.order, onChange: (order) => onChange({ order }) }}
      >
        <BrowseToolbarPillGroups>
          <BrowseColorPillGroup colors={state.colors} onChange={(colors) => onChange({ colors })} />
          {showRarity ? (
            <BrowseRarityPillGroup
              rarities={state.rarities}
              onChange={(rarities) => onChange({ rarities })}
            />
          ) : null}
          <BrowseFilterSection title="Options">
            <BrowseFilterPillRow>
              {state.entity === "cards" ? (
                <BrowseFilterPill
                  label="Commander legal"
                  selected={state.commanderLegal}
                  onClick={() => onChange({ commanderLegal: !state.commanderLegal })}
                />
              ) : null}
              <BrowseFilterPill
                label="Game Changer"
                selected={state.gameChanger}
                onClick={() => onChange({ gameChanger: !state.gameChanger })}
              />
              <BrowseFilterPill
                label="Reserved"
                selected={state.reserved}
                onClick={() => onChange({ reserved: !state.reserved })}
              />
            </BrowseFilterPillRow>
          </BrowseFilterSection>
        </BrowseToolbarPillGroups>
      </BrowseFilterPanelRow>
    </BrowseFilterPanel>
  );
}

export function defaultBrowseHubToolbarState(
  entity: BrowseEntity = "cards",
): BrowseHubToolbarState {
  const sort = defaultCatalogSort();
  return {
    entity,
    query: "",
    sort,
    order: defaultCatalogOrder(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    commanderLegal: false,
    role: "",
    theme: "",
    gameChanger: false,
    reserved: false,
    priceBand: "",
  };
}

export function buildBrowseHubSearchParams(
  state: BrowseHubToolbarState,
  cursor?: string | null,
): URLSearchParams {
  const params = new URLSearchParams({
    entity: state.entity,
    sort: state.sort,
    order: state.order,
    limit: "50",
  });

  if (cursor) params.set("cursor", cursor);
  if (state.query.trim().length >= 2) params.set("q", state.query.trim());
  appendCatalogFilterParams(params, {
    colors: state.colors,
    rarities: state.entity === "cards" ? state.rarities : [],
    typeContains: state.typeContains,
    cmcMin: state.cmcMin,
    cmcMax: state.cmcMax,
    commanderLegal: state.entity === "cards" ? state.commanderLegal : false,
  });

  if (state.role) params.set("role", state.role);
  if (state.theme) params.set("theme", state.theme);
  if (state.gameChanger) params.set("gc", "1");
  if (state.reserved) params.set("reserved", "1");
  if (state.priceBand) params.set("price_band", state.priceBand);

  // Keep color param even when empty helpers omit — colorsToParam already handled above.
  void colorsToParam;

  return params;
}
