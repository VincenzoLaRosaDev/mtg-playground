import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageListMetaProps = {
  children: ReactNode;
  className?: string;
};

/** Secondary line under browse toolbars — counts, hints, badges. */
export function PageListMeta({ children, className }: PageListMetaProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}
