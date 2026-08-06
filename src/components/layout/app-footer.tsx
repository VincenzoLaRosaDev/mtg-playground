import Link from "next/link";

import { siteContainerClassName } from "@/lib/ui/layout";

const FOOTER_LINK_CLASS =
  "font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div
        className={`${siteContainerClassName} flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6 text-xs text-muted-foreground`}
      >
        <nav
          aria-label="Footer"
          className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2"
        >
          <Link href="/about" className={FOOTER_LINK_CLASS}>
            About
          </Link>
          <Link href="/privacy" className={FOOTER_LINK_CLASS}>
            Privacy
          </Link>
          <Link href="/terms" className={FOOTER_LINK_CLASS}>
            Terms
          </Link>
          <a
            href="mailto:v.larosa.dev@gmail.com?subject=MTGPlayground%20beta%20access%20request"
            className={FOOTER_LINK_CLASS}
          >
            Request beta access
          </a>
        </nav>
        <p>
          Card and precon data from{" "}
          <a href="https://scryfall.com" className={FOOTER_LINK_CLASS}>
            Scryfall
          </a>{" "}
          and{" "}
          <a href="https://mtgjson.com" className={FOOTER_LINK_CLASS}>
            MTGJSON
          </a>
          . Not affiliated with Wizards of the Coast.
        </p>
      </div>
    </footer>
  );
}
