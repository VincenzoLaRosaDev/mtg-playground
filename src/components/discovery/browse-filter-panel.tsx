import type { ReactNode } from "react";

import { BrowseSortOrderToggle } from "@/components/discovery/browse-sort-order-toggle";
import { browseToolbarPanelClassName } from "@/components/discovery/browse-toolbar-shared";
import { Card, CardContent } from "@/components/ui/card";
import type { BrowseOrder } from "@/lib/browse/types";
import { cn } from "@/lib/utils";

type BrowseFilterPanelProps = {
  children: ReactNode;
  className?: string;
};

export function BrowseFilterPanel({ children, className }: BrowseFilterPanelProps) {
  return (
    <Card size="sm" className={cn("shadow-sm", className)}>
      <CardContent className={cn(browseToolbarPanelClassName, "px-3 pt-1")}>{children}</CardContent>
    </Card>
  );
}

type BrowseFilterPanelRowProps = {
  children: ReactNode;
  className?: string;
  sortOrder?: {
    order: BrowseOrder;
    onChange: (order: BrowseOrder) => void;
  };
};

/** Last (or any) panel row — optional sort-order icon flush right, aligned to row baseline. */
export function BrowseFilterPanelRow({
  children,
  className,
  sortOrder,
}: BrowseFilterPanelRowProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {sortOrder ? (
        <BrowseSortOrderToggle order={sortOrder.order} onChange={sortOrder.onChange} />
      ) : null}
    </div>
  );
}
