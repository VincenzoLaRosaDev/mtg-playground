"use client";

import { useEffect, useState } from "react";

import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";
import { DETAIL_SECTION_UNIQUE_NAV_CLASS } from "@/lib/ui/detail-section-nav";

type DetailSectionNavProps = {
  items: DetailSectionNavItem[];
  scrollable?: boolean;
};

const linkBaseClassName =
  "block border-l-2 py-1 pl-3 text-sm leading-snug transition-colors";

const linkInactiveClassName =
  "border-transparent text-muted-foreground hover:border-border hover:text-foreground";

const linkActiveClassName = "border-primary font-medium text-foreground";

export function DetailSectionNav({ items, scrollable = false }: DetailSectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element != null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        const nextId = visible[0]?.target.id;
        if (nextId) {
          setActiveId(nextId);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) {
    return null;
  }

  return (
    <nav
      aria-label="Page sections"
      className={`flex min-h-0 flex-col border-t border-border pt-4 ${
        scrollable ? "flex-1 overflow-hidden" : ""
      }`}
    >
      <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul
        className={`flex flex-col gap-0.5 ${
          scrollable
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] pr-1"
            : ""
        }`}
      >
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={`${linkBaseClassName} ${
                  isActive ? linkActiveClassName : linkInactiveClassName
                } ${item.uniqueToView ? DETAIL_SECTION_UNIQUE_NAV_CLASS : ""}`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
