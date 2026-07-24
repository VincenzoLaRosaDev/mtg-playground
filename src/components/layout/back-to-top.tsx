"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SHOW_AFTER_SCROLL_PX = 400;

type BackToTopProps = {
  label?: string;
};

/** Fixed FAB: always centered, same bottom offset as the catalog debug panel. */
export function BackToTop({ label = "Back to top" }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > SHOW_AFTER_SCROLL_PX);
      console.log("scrollY", window.scrollY);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function handleClick() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <Button
      type="button"
      className={cn(
        // Match CatalogDebugPanel `bottom-4`; solid site border/surface (no frosted glass).
        "relative z-10 inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 overflow-hidden px-3 text-[0.8rem] font-medium text-foreground border-border rounded-[0.625rem]",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        "bg-background hover:bg-muted hover:text-foreground",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      inert={!visible ? true : undefined}
      onClick={handleClick}
    >
      <span className="relative z-10">{label}</span>
      <ArrowUp className="size-3.5" aria-hidden />
    </Button>
  );
}
