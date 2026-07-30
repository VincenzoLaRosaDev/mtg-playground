"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { clearBodyScrollRestore } from "@/lib/ui/scroll";

/**
 * Scroll to top on pathname changes (Browse → card, Sets → set detail, etc.).
 * Skips browser back/forward so history scroll restoration still works.
 * Query-only navigations must use `router.*(href, { scroll: false })` instead
 * (VersionPicker, As card/As commander, list filters) so this effect does not run.
 *
 * Also clears any sheet body-scroll restore target: otherwise unlocking a sheet
 * after "View detail" (or other in-sheet Links) re-applies the pre-open scrollY
 * and undoes this scroll-to-top.
 */
export function ScrollToTopOnPathnameChange() {
  const pathname = usePathname();
  const isPopStateRef = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      isPopStateRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    clearBodyScrollRestore();
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
