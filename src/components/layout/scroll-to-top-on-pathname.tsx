"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Scroll to top on pathname changes (Browse → card, Sets → set detail, etc.).
 * Skips browser back/forward so history scroll restoration still works.
 * Query-only navigations must use `router.*(href, { scroll: false })` instead.
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
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
