"use client";

import { mainNav, isAuthRequiredHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { NavLink } from "@/components/layout/nav-link";
import { RequireAuthLink } from "@/components/layout/require-auth-link";
import { usePathname } from "next/navigation";

type NavLinksProps = {
  className?: string;
};

export function NavLinks({ className }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {mainNav.map((item) => {
        if (isAuthRequiredHref(item.href)) {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <RequireAuthLink
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </RequireAuthLink>
          );
        }

        return <NavLink key={item.href} href={item.href} label={item.label} />;
      })}
    </nav>
  );
}
