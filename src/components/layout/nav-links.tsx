"use client";

import { mainNav } from "@/lib/navigation";

import { NavLink } from "@/components/layout/nav-link";

type NavLinksProps = {
  className?: string;
};

export function NavLinks({ className }: NavLinksProps) {
  return (
    <nav className={className}>
      {mainNav.map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} />
      ))}
    </nav>
  );
}
