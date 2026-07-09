import Link from "next/link";

import { CardImage } from "@/components/discovery/card-image";
import type { CardRelative } from "@/lib/scryfall/card-relatives";
import { formatSubtypeList } from "@/lib/scryfall/type-utils";

type CardRelativesBySubtypeProps = {
  subtypes: string[];
  relatives: CardRelative[];
};

export function CardRelativesBySubtype({ subtypes, relatives }: CardRelativesBySubtypeProps) {
  if (subtypes.length === 0 || relatives.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Relatives by subtype
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Other Commander-legal cards sharing: {formatSubtypeList(subtypes)}
      </p>
      <ul className="mt-4 space-y-3">
        {relatives.map((relative) => (
          <li
            key={`${relative.name}-${relative.typeLine}`}
            className="flex items-center gap-3"
          >
            {relative.imageUri ? (
              <CardImage src={relative.imageUri} alt={relative.name} variant="thumbnail" />
            ) : (
              <div className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                ?
              </div>
            )}
            <div className="min-w-0">
              {relative.edhrecSlug ? (
                <Link
                  href={`/cards/${relative.edhrecSlug}`}
                  className="text-sm font-medium hover:underline"
                >
                  {relative.name}
                </Link>
              ) : (
                <p className="text-sm font-medium">{relative.name}</p>
              )}
              <p className="text-xs text-zinc-500">
                CMC {relative.cmc} · {relative.typeLine}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
