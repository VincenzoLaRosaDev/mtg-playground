"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";
import { DETAIL_SECTION_UNIQUE_NAV_CLASS } from "@/lib/ui/detail-section-nav";
import { DETAIL_SECTION_JUMP_STICKY_CLASS } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

type DetailSectionJumpProps = {
  items: DetailSectionNavItem[];
};

export function DetailSectionJump({ items }: DetailSectionJumpProps) {
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

  const activeLabel = items.find((item) => item.id === activeId)?.label ?? items[0]?.label ?? "Sections";

  return (
    <div className={DETAIL_SECTION_JUMP_STICKY_CLASS}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between gap-2 font-normal"
              aria-label="Jump to page section"
            />
          }
        >
          <span className="truncate">{activeLabel}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-(--anchor-width) min-w-[min(100%,18rem)]">
          <DropdownMenuGroup>
            {items.map((item) => {
              const isActive = activeId === item.id;

              return (
                <DropdownMenuItem
                  key={item.id}
                  nativeButton={false}
                  render={<a href={`#${item.id}`} />}
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "cursor-pointer",
                    isActive && "bg-accent font-medium text-foreground",
                    item.uniqueToView && DETAIL_SECTION_UNIQUE_NAV_CLASS,
                  )}
                >
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
