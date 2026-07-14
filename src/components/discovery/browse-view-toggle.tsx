import { LayoutGrid, List } from "lucide-react";

type BrowseViewMode = "grid" | "list";

type BrowseViewToggleProps = {
  value: BrowseViewMode;
  onChange: (mode: BrowseViewMode) => void;
};

export function BrowseViewToggle({ value, onChange }: BrowseViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {(["grid", "list"] as const).map((mode) => {
        const isActive = value === mode;
        const ModeIcon = mode === "grid" ? LayoutGrid : List;
        const label = mode === "grid" ? "Grid view" : "List view";

        return (
          <button
            key={mode}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            onClick={() => onChange(mode)}
            className={`rounded-md p-2 transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ModeIcon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

export type { BrowseViewMode };
