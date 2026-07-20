import { siteContainerClassName } from "@/lib/ui/layout";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className={`${siteContainerClassName} py-6 text-xs text-muted-foreground`}>
        <p>
          Card data from{" "}
          <a
            href="https://scryfall.com"
            className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
          >
            Scryfall
          </a>
          . Not affiliated with Wizards of the Coast.
        </p>
      </div>
    </footer>
  );
}
