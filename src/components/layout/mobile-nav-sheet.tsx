"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RequireAuthLink } from "@/components/layout/require-auth-link";
import { isAuthRequiredHref, mainNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNavSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-4" aria-hidden />
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 overflow-hidden bg-background p-0"
      >
        <SheetHeader className="shrink-0 px-4 py-4 sm:px-6">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <nav
          aria-label="Main"
          className="flex flex-col gap-1 px-4 pb-8 sm:px-6"
        >
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const linkClass = cn(
              "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            );

            if (isAuthRequiredHref(item.href)) {
              return (
                <RequireAuthLink
                  key={item.href}
                  href={item.href}
                  className={linkClass}
                  aria-current={isActive ? "page" : undefined}
                  onBeforeNavigate={() => setOpen(false)}
                >
                  {item.label}
                </RequireAuthLink>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={linkClass}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
