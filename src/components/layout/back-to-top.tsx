"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from "@/lib/ui/layout";
import { scrollWindowToTop } from "@/lib/ui/scroll";
import { cn } from "@/lib/utils";

const SHOW_AFTER_SCROLL_PX = 400;

type BackToTopProps = {
  /**
   * True once its dock point (the row it's rendered in — see
   * `ListLoadMoreRow`) is fully visible: renders in normal flow there instead
   * of floating, so it never drifts over the footer or other page content.
   */
  docked?: boolean;
};

/** Floats bottom-right (within the site max-width) until `docked`. */
export function BackToTop({ docked = false }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > SHOW_AFTER_SCROLL_PX);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const button = (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className={cn(
        "z-30 size-11 rounded-lg border-border bg-card text-foreground shadow-none mb-0!",
        "hover:bg-muted hover:text-foreground",
        "transition-opacity duration-200 motion-reduce:transition-none",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      inert={!visible ? true : undefined}
      onClick={scrollWindowToTop}
    >
      <ArrowUp className="size-3.5" aria-hidden />
    </Button>
  );

  if (docked) {
    return button;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30">
      <div className={cn("mx-auto flex justify-end", SITE_MAX_WIDTH_CLASS, SITE_GUTTER_CLASS)}>
        <div className="pointer-events-auto pr-2 xl:pr-3">{button}</div>
      </div>
    </div>
  );
}
