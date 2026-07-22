"use client";

import { useActiveDetailSectionId } from "@/hooks/use-active-detail-section-id";
import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";

type DetailSectionNavProps = {
  items: DetailSectionNavItem[];
};

const linkBaseClassName =
  "block cursor-pointer border-l-2 py-1 pl-3 text-sm leading-snug transition-colors";

const linkInactiveClassName =
  "border-transparent text-muted-foreground hover:border-border hover:text-foreground";

const linkActiveClassName = "border-primary font-medium text-foreground";

export function DetailSectionNav({ items }: DetailSectionNavProps) {
  const [activeId, setActiveId] = useActiveDetailSectionId(items);

  if (items.length < 2) {
    return null;
  }

  return (
    <nav aria-label="Page sections" className="flex h-full min-h-0 flex-col">
      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain pr-1">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={`${linkBaseClassName} ${
                  isActive ? linkActiveClassName : linkInactiveClassName
                }`}
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
