import Link from "next/link";
import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { siteContainerClassName } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

type Breadcrumb = {
  label: string;
  href: string;
};

type PageShellProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
  /** Optional toolbar row (filters, window selector) rendered below the page header. */
  toolbar?: ReactNode;
  /**
   * Actions aligned with the title block (right on `sm+`, under title on mobile).
   * Homologous to CardDetailModal header actions (View detail / Go to set).
   */
  headerActions?: ReactNode;
};

export function PageShell({
  title,
  description,
  breadcrumbs,
  children,
  toolbar,
  headerActions,
}: PageShellProps) {
  return (
    <div className={cn(siteContainerClassName, "py-8 lg:py-10")}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden>/</span>}
              <Link href={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-base text-muted-foreground">{description}</p>
          )}
        </div>
        {headerActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
            {headerActions}
          </div>
        ) : null}
      </header>

      {toolbar ? (
        <div className="mt-6 space-y-4">
          {toolbar}
          <Separator />
        </div>
      ) : (
        <Separator className="mt-6" />
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}
