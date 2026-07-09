import Link from "next/link";

type EdhrecSimilarCommandersProps = {
  similarSlugs: string[];
};

function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function EdhrecSimilarCommanders({ similarSlugs }: EdhrecSimilarCommandersProps) {
  if (similarSlugs.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Similar commanders
      </h2>
      <ul className="mt-3 space-y-2">
        {similarSlugs.slice(0, 8).map((slug) => (
          <li key={slug}>
            <Link href={`/commanders/${slug}`} className="text-sm font-medium hover:underline">
              {slugToLabel(slug)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
