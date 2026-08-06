import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequireAuthLink } from "@/components/layout/require-auth-link";
import { isAuthRequiredHref } from "@/lib/navigation";
import { createPageMetadata } from "@/lib/seo/site";
import { siteContainerClassName } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "MTG catalog, collection & decks",
  description:
    "Browse the full Scryfall catalog, track every printing you own, and build legal decks across every format — all in one place.",
  path: "/",
});

const DISCOVERY_SHORTCUTS = [
  {
    href: "/browse",
    title: "Browse cards",
    description: "Faceted Scryfall catalog with EDH Inclusion rank, roles, and formats.",
    emphasis: "primary" as const,
  },
  {
    href: "/collection",
    title: "Collection",
    description: "Track exactly which printings and finishes you own.",
    emphasis: "primary" as const,
  },
  {
    href: "/decks",
    title: "Decks",
    description: "Build multi-format decks with legality checks and owned/missing tracking.",
    emphasis: "primary" as const,
  },
  {
    href: "/sets",
    title: "Sets",
    description: "Explore Magic sets and open card printings.",
    emphasis: "secondary" as const,
  },
  {
    href: "/precons",
    title: "Precons",
    description: "Browse official constructed precons and fork them into your own deck.",
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium tracking-wide text-primary">Catalog & decks</p>
          <h1 className="mt-4">
            <Image
              src="/mtgplayground-lockup-horizontal.svg"
              alt="MTGPlayground"
              width={560}
              height={160}
              unoptimized
              priority
              className="h-18 w-auto sm:h-20"
            />
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse the full Scryfall catalog, track every printing you own, and build legal decks
            across every format — all in one place.
          </p>
        </div>
        <Button size="lg" className="shrink-0" nativeButton={false} render={<Link href="/about" />}>
          About
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DISCOVERY_SHORTCUTS.map((shortcut) => {
          const LinkComponent = isAuthRequiredHref(shortcut.href) ? RequireAuthLink : Link;

          return (
            <LinkComponent key={shortcut.href} href={shortcut.href} className="group block h-full">
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
            </LinkComponent>
          );
        })}
      </div>
    </div>
  );
}
