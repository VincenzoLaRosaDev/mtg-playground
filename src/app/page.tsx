import Link from "next/link";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata = createPageMetadata({
  title: "Commander deck tools",
  description:
    "Analyze Commander decks, compare against EDHREC meta, and share brews with the community.",
  path: "/",
});

export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col justify-center px-4 py-16">
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
          className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Search cards
        </Link>
        <Link
          href="/commanders"
          className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Browse commanders
        </Link>
      </div>
    </div>
  );
}
