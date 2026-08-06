"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";

import { GlobalSearch } from "@/components/discovery/global-search";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { NavLinks } from "@/components/layout/nav-links";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";
import {
  SITE_HEADER_CHROME_SLOT_ID,
  SITE_HEADER_HEIGHT_VAR,
  SITE_HEADER_NAV_ID,
  siteContainerClassName,
} from "@/lib/ui/layout";
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
    // Sticky wrapper: nav + chrome slot rubber-band together on overscroll.
    // Height var measures the nav `<header>` only (not the list filter chrome).
    <div className="sticky top-0 z-40">
      <header
        id={SITE_HEADER_NAV_ID}
        ref={headerRef}
        className="border-b border-border bg-card"
      >
        <div className={cn(siteContainerClassName, "py-3 lg:py-4")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex shrink-0 items-center gap-4">
                <Link href="/" aria-label="MTGPlayground home">
                  <Image
                    src="/mtgplayground-mark.svg"
                    alt="MTGPlayground"
                    width={240}
                    height={240}
                    unoptimized
                    className="h-8 w-8"
                    priority
                  />
                </Link>
                <Badge variant="default" className="h-6 px-2.5 text-sm">
                  Beta
                </Badge>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <UserMenu />
                <MobileNavSheet />
              </div>
            </div>

            <div className="w-full lg:max-w-md lg:flex-1 xl:max-w-xl">
              <Suspense fallback={<SearchPageFallback />}>
                <GlobalSearch />
              </Suspense>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <NavLinks className="flex flex-wrap items-center gap-1" />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
      {/* h-0 w-full: drawer/tongue are absolute — opening must not grow sticky height. */}
      <div id={SITE_HEADER_CHROME_SLOT_ID} className="relative h-0 w-full" />
    </div>
  );
}
