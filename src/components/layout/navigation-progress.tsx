"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import {
  getNavigationProgressState,
  maybeCompleteNavigationProgressForRoute,
  NAVIGATION_PROGRESS_IDLE,
  routeKeyFromParts,
  shouldStartNavigationProgressForAnchor,
  startNavigationProgress,
  subscribeNavigationProgress,
} from "@/lib/ui/navigation-progress";
import { cn } from "@/lib/utils";

/**
 * Thin full-width top bar during App Router soft-nav (Link clicks).
 * Complements block-fino-ai-dati: previous page stays visible while RSC loads.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const state = useSyncExternalStore(
    subscribeNavigationProgress,
    getNavigationProgressState,
    () => NAVIGATION_PROGRESS_IDLE,
  );

  // Capture phase: Next.js Link preventDefault for soft-nav must still start
  // the bar. Overlay-only links opt out via `data-nav-progress="skip"`.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (
        !shouldStartNavigationProgressForAnchor(anchor, event, {
          pathname: window.location.pathname,
          search: window.location.search,
        })
      ) {
        return;
      }
      startNavigationProgress();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Finish when the URL leaves the page where the click started (remount-safe).
  useEffect(() => {
    maybeCompleteNavigationProgressForRoute(
      routeKeyFromParts(pathname, search),
    );
  }, [pathname, search]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5",
        state.visible ? "opacity-100" : "opacity-0",
        "transition-opacity duration-150 motion-reduce:transition-none",
      )}
    >
      <div
        className={cn(
          "h-full origin-left bg-primary",
          "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        )}
        style={{ width: `${state.progress}%` }}
      />
    </div>
  );
}
