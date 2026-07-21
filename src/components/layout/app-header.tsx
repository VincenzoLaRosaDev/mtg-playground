"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";

import { GlobalSearch } from "@/components/discovery/global-search";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { NavLinks } from "@/components/layout/nav-links";
import { Input } from "@/components/ui/input";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";
import { SITE_HEADER_HEIGHT_VAR, siteContainerClassName } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

function SearchPageFallback() {
  return (
    <Input
      type="search"
      disabled
      placeholder={`${CARD_TEXT_SEARCH_PLACEHOLDER} + sets`}
      className="opacity-60"
    />
  );
}

export function AppHeader() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        SITE_HEADER_HEIGHT_VAR,
        `${header.offsetHeight}px`,
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md"
    >
      <div className={cn(siteContainerClassName, "py-3 lg:py-4")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="font-heading text-lg font-semibold tracking-tight text-foreground"
            >
              MTGPlayground
            </Link>

            <MobileNavSheet />
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
