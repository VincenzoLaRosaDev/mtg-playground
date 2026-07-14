type BrowseTabOption = {
  id: string;
  label: string;
  emphasis?: "primary" | "secondary";
};

type BrowseTabsProps = {
  tabs: BrowseTabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export function BrowseTabs({ tabs, activeTab, onChange }: BrowseTabsProps) {
  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border pb-3">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isSecondary = tab.emphasis === "secondary";

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full font-medium transition-colors ${
              isSecondary
                ? `px-3 py-1.5 text-xs ${
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                : `px-4 py-2 text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
