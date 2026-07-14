import Link from "next/link";

export type EntityDetailRoute = "card" | "commander";

type EntityDetailTabsProps = {
  slug: string;
  activeRoute: EntityDetailRoute;
  setCode?: string;
};

function buildCardHref(slug: string, setCode?: string): string {
  if (!setCode) {
    return `/cards/${slug}`;
  }

  const params = new URLSearchParams({ set: setCode.toLowerCase() });
  return `/cards/${slug}?${params.toString()}`;
}

export function EntityDetailTabs({ slug, activeRoute, setCode }: EntityDetailTabsProps) {
  const tabs: { id: EntityDetailRoute; label: string; href: string }[] = [
    { id: "card", label: "Card", href: buildCardHref(slug, setCode) },
    { id: "commander", label: "Commander", href: `/commanders/${slug}` },
  ];

  return (
    <nav
      aria-label="Entity detail views"
      className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeRoute;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
