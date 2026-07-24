"use client";

import { useEffect, useRef, useState } from "react";

import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { BackToTop } from "@/components/layout/back-to-top";

type ListLoadMoreRowProps = {
  /** Omit on routes with no pagination (e.g. set detail) — only Back to top renders. */
  loadMore?: {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    label?: string;
  };
};

/**
 * End-of-list row: Load more stays centered regardless of Back to top's width
 * (equal flanking columns). Back to top floats bottom-right until this row is
 * fully visible on screen, then docks here (normal flow) instead of
 * continuing to float over the footer or other page content below the list.
 */
export function ListLoadMoreRow({ loadMore }: ListLoadMoreRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    function update() {
      const node = rowRef.current;
      if (!node) return;
      setDocked(node.getBoundingClientRect().bottom <= window.innerHeight);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={rowRef} className="h-11 mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div aria-hidden />
      <div className="flex justify-center">
        {loadMore ? <LoadMoreButton {...loadMore} /> : null}
      </div>
      <div className="flex justify-end pr-2 xl:pr-3">
        <BackToTop docked={docked} />
      </div>
    </div>
  );
}
