import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/seo/site";
import { siteContainerClassName } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "MTG catalog & decks",
  description:
    "Browse Magic cards and sets from Scryfall, track your collection, and build multi-format decks.",
  path: "/",
});

const DISCOVERY_SHORTCUTS = [
  {
    href: "/browse",
    title: "Browse cards",
    description: "Faceted Scryfall catalog with Inclusion rank, roles, and formats.",
    emphasis: "primary" as const,
  },
  {
    href: "/sets",
    title: "Sets",
    description: "Explore Magic sets and open card printings.",
    emphasis: "primary" as const,
  },
  {
    href: "/browse?commanders_only=true",
    title: "Legal commanders",
    description: "Filter legendary cards that can be commanders — not a meta ranking.",
    emphasis: "secondary" as const,
  },
  {
    href: "/search",
    title: "Search",
    description: "Find cards, commanders, and sets across the catalog.",
    emphasis: "secondary" as const,
  },
] as const;

export default function Home() {
  return (
    <div className={`${siteContainerClassName} flex flex-col justify-center py-16 lg:py-20`}>
      <p className="text-sm font-medium tracking-wide text-primary">Catalog & decks</p>
      <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">MTGPlayground</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Browse Magic cards from Scryfall, manage printings in your collection, and build decks across
        formats as the platform grows.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {DISCOVERY_SHORTCUTS.map((shortcut) => (
          <Link key={shortcut.href} href={shortcut.href} className="group block h-full">
            <Card
              size="sm"
              className={cn(
                "h-full transition-colors hover:border-primary/30 hover:shadow-md",
                shortcut.emphasis === "primary" && "border-primary/20 bg-primary/5",
              )}
            >
              <CardHeader>
                <CardTitle className="group-hover:text-primary">{shortcut.title}</CardTitle>
                <CardDescription>{shortcut.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-sm font-medium text-primary">Open →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
