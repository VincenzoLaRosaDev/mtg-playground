"use client";

import { useEffect, useMemo, useState } from "react";

import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";

/**
 * Tracks which detail section is “current” for TOC / jump menus.
 * Resets when the item set changes (e.g. As card ↔ As commander) and
 * syncs immediately from scroll position so tab switches don’t leave a stale id.
 */
export function useActiveDetailSectionId(
  items: DetailSectionNavItem[],
): [string | null, (id: string) => void] {
  const itemKey = useMemo(() => items.map((item) => item.id).join("|"), [items]);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const firstId = items[0]?.id ?? null;
    setActiveId(firstId);

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element != null);

    if (elements.length === 0) {
      return;
    }

    const pickActive = () => {
      // Section whose top last crossed ~15% of the viewport (matches previous rootMargin band).
      const marker = window.innerHeight * 0.15;
      let current = elements[0]!.id;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= marker + 8) {
          current = element.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const observer = new IntersectionObserver(pickActive, {
      rootMargin: "-15% 0px -70% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 1],
    });

    for (const element of elements) {
      observer.observe(element);
    }

    pickActive();
    window.addEventListener("scroll", pickActive, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pickActive);
    };
    // itemKey captures items identity; items is read inside for labels/ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on section set change only
  }, [itemKey]);

  return [activeId, setActiveId];
}
