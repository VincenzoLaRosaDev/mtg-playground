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
};

export function PageShell({
  title,
  description,
  breadcrumbs,
  children,
  toolbar,
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

      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-base text-muted-foreground">{description}</p>
        )}
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
