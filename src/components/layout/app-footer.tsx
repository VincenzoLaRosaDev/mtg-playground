export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-zinc-500">
        <p>
          Card data from{" "}
          <a
            href="https://scryfall.com"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Scryfall
          </a>
          . Meta data from{" "}
          <a
            href="https://edhrec.com"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            EDHREC
          </a>
          . Not affiliated with Wizards of the Coast.
        </p>
      </div>
    </footer>
  );
}
