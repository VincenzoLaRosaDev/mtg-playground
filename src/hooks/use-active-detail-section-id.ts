"use client";

import { useEffect, useMemo, useState } from "react";

import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";

function getScrollRoot(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Tracks which detail section is “current” for TOC / jump menus.
 * Resets when the item set changes (e.g. As card ↔ As commander) and
 * syncs immediately from scroll position so tab switches don’t leave a stale id.
 * Uses the nearest scrollport (window or sheet body) so modal lists work too.
 */
export function useActiveDetailSectionId(
  items: DetailSectionNavItem[],
): [string | null, (id: string) => void] {
  const itemKey = useMemo(() => items.map((item) => item.id).join("|"), [items]);
  const [trackedKey, setTrackedKey] = useState(itemKey);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  // Reset during render (not in an effect) when the section set changes —
  // avoids an extra render pass and keeps activeId in sync with itemKey immediately.
  if (itemKey !== trackedKey) {
    setTrackedKey(itemKey);
    setActiveId(items[0]?.id ?? null);
  }

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element != null);

    if (elements.length === 0) {
      return;
    }

    const scrollRoot = getScrollRoot(elements[0]!);

    const pickActive = () => {
      const rootTop = scrollRoot
        ? scrollRoot.getBoundingClientRect().top
        : 0;
      const rootHeight = scrollRoot
        ? scrollRoot.clientHeight
        : window.innerHeight;
      // Section whose top last crossed ~15% of the scrollport.
      const marker = rootTop + rootHeight * 0.15;
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
      root: scrollRoot,
      rootMargin: "-15% 0px -70% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 1],
    });

    for (const element of elements) {
      observer.observe(element);
    }

    pickActive();
    const scrollTarget: HTMLElement | Window = scrollRoot ?? window;
    scrollTarget.addEventListener("scroll", pickActive, { passive: true });

    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", pickActive);
    };
    // itemKey captures items identity; items is read inside for labels/ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on section set change only
  }, [itemKey]);

  return [activeId, setActiveId];
}
