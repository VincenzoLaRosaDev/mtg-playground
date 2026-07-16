"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const router = useRouter();

  const tabs: { id: EntityDetailRoute; label: string; href: string }[] = [
    { id: "card", label: "Card", href: buildCardHref(slug, setCode) },
    { id: "commander", label: "Commander", href: `/commanders/${slug}` },
  ];

  return (
    <div className="mb-6">
      <ToggleGroup
        value={[activeRoute]}
        onValueChange={(next) => {
          const selected = next[0];
          if (selected !== "card" && selected !== "commander") {
            return;
          }
          if (selected === activeRoute) {
            return;
          }
          const tab = tabs.find((entry) => entry.id === selected);
          if (tab) {
            router.push(tab.href);
          }
        }}
        variant="outline"
        size="default"
        spacing={0}
        aria-label="Entity detail views"
      >
        {tabs.map((tab) => (
          <ToggleGroupItem
            key={tab.id}
            value={tab.id}
            nativeButton={false}
            render={<Link href={tab.href} />}
            aria-current={tab.id === activeRoute ? "page" : undefined}
            className="px-4 data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            {tab.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
