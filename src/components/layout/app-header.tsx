"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { GlobalSearch } from "@/components/discovery/global-search";
import { mainNav } from "@/lib/navigation";

function SearchPageFallback() {
  return (
    <input
      type="search"
      disabled
      placeholder="Search cards, commanders, sets..."
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
    />
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              EDHForge
            </Link>

            <nav className="flex flex-wrap items-center gap-1 lg:hidden">
              {mainNav.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="w-full lg:max-w-md lg:flex-1">
            <Suspense fallback={<SearchPageFallback />}>
              <GlobalSearch />
            </Suspense>
          </div>

          <nav className="hidden flex-wrap items-center gap-1 lg:flex">
            {mainNav.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
