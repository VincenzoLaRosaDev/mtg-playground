"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BrowseFilterPanel } from "@/components/discovery/browse-filter-panel";
import { BrowseSelectField } from "@/components/discovery/browse-filter-controls";
import { browseToolbarCommanderDetailGridClassName } from "@/components/discovery/browse-toolbar-shared";
import {
  COMMANDER_BRACKET_OPTIONS,
  COMMANDER_BUDGET_OPTIONS,
} from "@/lib/edhrec/filter-options";

type CommanderFilterBarProps = {
  themeOptions: string[];
  activeTheme: string;
  activeBudget: string;
  activeBracket: string;
};

export function CommanderFilterBar({
  themeOptions,
  activeTheme,
  activeBudget,
  activeBracket,
}: CommanderFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: "theme" | "budget" | "bracket", value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const themeSelectOptions = [
    { value: "", label: "All themes" },
    ...themeOptions.map((theme) => ({ value: theme, label: theme })),
  ];

  const budgetSelectOptions = [
    { value: "", label: "Any budget" },
    ...COMMANDER_BUDGET_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  ];

  const bracketSelectOptions = [
    { value: "", label: "Any bracket" },
    ...COMMANDER_BRACKET_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  ];

  return (
    <BrowseFilterPanel>
      <div className={browseToolbarCommanderDetailGridClassName}>
        <BrowseSelectField
          label="Theme"
          value={activeTheme}
          onChange={(value) => updateFilter("theme", value)}
          options={themeSelectOptions}
        />

        <BrowseSelectField
          label="Budget"
          value={activeBudget}
          onChange={(value) => updateFilter("budget", value)}
          options={budgetSelectOptions}
        />

        <BrowseSelectField
          label="Bracket"
          value={activeBracket}
          onChange={(value) => updateFilter("bracket", value)}
          options={bracketSelectOptions}
        />
      </div>
    </BrowseFilterPanel>
  );
}
