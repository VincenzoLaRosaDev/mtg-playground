import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  DETAIL_SECTION_HEADING_CLASS,
  DETAIL_SECTION_SCROLL_MARGIN,
  detailSectionPanelClass,
} from "@/lib/ui/detail-section-nav";

type DetailSectionPanelProps = {
  title: string;
  children: ReactNode;
  id?: string;
  uniqueToView?: boolean;
  className?: string;
  headingClassName?: string;
};

export function DetailSectionPanel({
  title,
  children,
  id,
  uniqueToView = false,
  className,
  headingClassName,
}: DetailSectionPanelProps) {
  return (
    <section
      id={id}
      className={cn(
        id && DETAIL_SECTION_SCROLL_MARGIN,
        detailSectionPanelClass(uniqueToView),
        className,
      )}
    >
      <h2 className={cn(DETAIL_SECTION_HEADING_CLASS, headingClassName)}>{title}</h2>
      {children}
    </section>
  );
}
