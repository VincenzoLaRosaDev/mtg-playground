import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Commander tools
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">EDHForge</h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-600">
        Analyze Commander decks, compare against the meta, and share brews with
        the community.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/cards"
          className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Search cards
        </Link>
      </div>

      <p className="mt-12 text-xs text-zinc-400">
        Card data from{" "}
        <a href="https://scryfall.com" className="underline">
          Scryfall
        </a>
        . Not affiliated with Wizards of the Coast.
      </p>
    </div>
  );
}
