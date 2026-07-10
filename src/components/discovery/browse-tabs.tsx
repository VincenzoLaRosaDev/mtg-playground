type BrowseTabOption = {
  id: string;
  label: string;
};

type BrowseTabsProps = {
  tabs: BrowseTabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export function BrowseTabs({ tabs, activeTab, onChange }: BrowseTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
