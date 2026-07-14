"use client";

import Link from "next/link";
import { Suspense } from "react";

import { GlobalSearch } from "@/components/discovery/global-search";
import { NavLinks } from "@/components/layout/nav-links";
import { Input } from "@/components/ui/input";
import { siteContainerClassName } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

function SearchPageFallback() {
  return (
    <Input
      type="search"
      disabled
      placeholder="Search cards, commanders, sets..."
      className="opacity-60"
    />
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className={cn(siteContainerClassName, "py-3 lg:py-4")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="font-heading text-lg font-semibold tracking-tight text-foreground"
            >
              EDHForge
            </Link>

            <NavLinks className="flex flex-wrap items-center gap-1 lg:hidden" />
          </div>

          <div className="w-full lg:max-w-md lg:flex-1 xl:max-w-xl">
            <Suspense fallback={<SearchPageFallback />}>
              <GlobalSearch />
            </Suspense>
          </div>

          <NavLinks className="hidden flex-wrap items-center gap-1 lg:flex" />
        </div>
      </div>
    </header>
  );
}
