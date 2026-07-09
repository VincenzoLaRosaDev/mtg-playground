import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = {
  label: string;
  href: string;
};

type PageShellProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
};

export function PageShell({
  title,
  description,
  breadcrumbs,
  children,
}: PageShellProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              <Link href={crumb.href} className="hover:text-zinc-800 dark:hover:text-zinc-200">
                {crumb.label}
              </Link>
            </span>
          ))}
        </nav>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-zinc-600">{description}</p>}
      </header>

      {children}
    </div>
  );
}
