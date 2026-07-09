import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardImage } from "@/components/discovery/card-image";
import { CardRelativesBySubtype } from "@/components/discovery/card-relatives-by-subtype";
import { EdhrecTopCommanders } from "@/components/discovery/edhrec-top-commanders";
import { StaleCacheBanner } from "@/components/discovery/stale-cache-banner";
import { PageShell } from "@/components/layout/page-shell";
import { getCachedCardData } from "@/lib/edhrec/cache";
import type { EdhrecCardList } from "@/lib/edhrec/types";
import { prisma } from "@/lib/db";
import { getCardRelativesBySubtype } from "@/lib/scryfall/card-relatives";
import { createPageMetadata } from "@/lib/seo/site";

type CardDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CardDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const card = await prisma.card.findFirst({
    where: { edhrecSlug: slug },
    select: { name: true, typeLine: true, imageUri: true },
  });

  if (!card) {
    return createPageMetadata({
      title: "Card not found",
      description: "The requested card could not be found.",
      path: `/cards/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: card.name,
    description: `${card.name} — ${card.typeLine}. Commander card page with EDHREC stats and related cards.`,
    path: `/cards/${slug}`,
    image: card.imageUri,
  });
}

function formatColorIdentity(colors: string[]): string {
  return colors.length > 0 ? colors.join("") : "Colorless";
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { slug } = await params;

  const card = await prisma.card.findFirst({
    where: { edhrecSlug: slug },
    select: {
      id: true,
      name: true,
      edhrecSlug: true,
      typeLine: true,
      cmc: true,
      colorIdentity: true,
      oracleText: true,
      keywords: true,
      imageUri: true,
      isCommander: true,
    },
  });

  if (!card) {
    notFound();
  }

  const edhrec = await getCachedCardData(slug, { warm: true });
  const cardlists = (edhrec.data?.cardlists ?? {}) as Record<string, EdhrecCardList>;
  const { subtypes, relatives } = await getCardRelativesBySubtype(card);

  return (
    <PageShell
      title={card.name}
      description={card.typeLine}
      breadcrumbs={[
        { label: "Cards", href: "/cards" },
        { label: card.name, href: `/cards/${slug}` },
      ]}
    >
      {edhrec.isStale && edhrec.syncedAt && (
        <div className="mb-6">
          <StaleCacheBanner syncedAt={edhrec.syncedAt} context="page" />
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div>
          {card.imageUri ? (
            <CardImage src={card.imageUri} alt={card.name} variant="detail" />
          ) : (
            <div className="flex aspect-[488/680] w-full max-w-[260px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              No image available
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Stats
            </h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              CMC {card.cmc} · {formatColorIdentity(card.colorIdentity)}
              {card.isCommander ? " · Commander-legal" : ""}
              {edhrec.data?.salt != null ? ` · Salt ${edhrec.data.salt.toFixed(2)}` : ""}
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Oracle text
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-800 dark:text-zinc-200">
              {card.oracleText ?? "No oracle text available."}
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Keywords
            </h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {card.keywords.length > 0 ? card.keywords.join(", ") : "None"}
            </p>
          </section>

          {edhrec.data ? (
            <EdhrecTopCommanders cardlists={cardlists} />
          ) : (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Top commanders
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                No EDHREC data cached for this card yet.
              </p>
            </section>
          )}

          <CardRelativesBySubtype subtypes={subtypes} relatives={relatives} />
        </div>
      </section>
    </PageShell>
  );
}
