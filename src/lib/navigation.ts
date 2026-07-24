export const mainNav = [
  { href: "/browse", label: "Browse" },
  { href: "/sets", label: "Sets" },
  { href: "/collection", label: "Collection" },
] as const;

/** Nav targets that open the sign-in sheet when signed out (no `/signin` page). */
export function isAuthRequiredHref(href: string): boolean {
  return href === "/collection" || href.startsWith("/collection/");
}
