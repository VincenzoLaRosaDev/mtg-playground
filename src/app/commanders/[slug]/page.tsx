import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardImage } from "@/components/discovery/card-image";
import { EdhrecSimilarCommanders } from "@/components/discovery/edhrec-similar-commanders";
import { EdhrecThemes } from "@/components/discovery/edhrec-themes";
import { EdhrecTopCards } from "@/components/discovery/edhrec-top-cards";
import { EntityDetailTabs } from "@/components/discovery/entity-detail-tabs";
import { MetaUnavailableNotice } from "@/components/discovery/meta-unavailable-notice";
import { StaleCacheBanner } from "@/components/discovery/stale-cache-banner";
import { PageShell } from "@/components/layout/page-shell";
import { getCachedCommanderProfile } from "@/lib/edhrec/cache";
import type { EdhrecCardList } from "@/lib/edhrec/types";
import { prisma } from "@/lib/db";
import { findPlayableCardByEdhrecSlug } from "@/lib/scryfall/catalog-filters";
import { formatColorIdentity, formatRank } from "@/lib/display/formatters";
import { createPageMetadata } from "@/lib/seo/site";

type CommanderDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const cardSelect = {
  name: true,
  typeLine: true,
  oracleText: true,
  imageUri: true,
  keywords: true,
  cmc: true,
  colorIdentity: true,
  isCommander: true,
} as const;

export async function generateMetadata({ params }: CommanderDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const [profile, card] = await Promise.all([
    prisma.edhrecCommanderProfile.findUnique({
      where: { slug },
      select: { name: true, rank: true },
    }),
    findPlayableCardByEdhrecSlug(prisma, slug, {
      name: true,
      typeLine: true,
      imageUri: true,
    }),
  ]);

  if (!profile && !card) {
    return createPageMetadata({
      title: "Commander not found",
      description: "The requested commander could not be found.",
      path: `/commanders/${slug}`,
      noIndex: true,
    });
  }

  const name = card?.name ?? profile!.name;
  const rankLabel = profile?.rank != null ? `Rank #${profile.rank}.` : "";

  return createPageMetadata({
    title: name,
    description: `${name} Commander profile. ${rankLabel} Top cards, themes, salt, and similar commanders.`,
    path: `/commanders/${slug}`,
    image: card?.imageUri,
  });
}

export default async function CommanderDetailPage({ params }: CommanderDetailPageProps) {
  const { slug } = await params;

  const [edhrec, card] = await Promise.all([
    getCachedCommanderProfile(slug, { warm: true }),
    findPlayableCardByEdhrecSlug(prisma, slug, cardSelect),
  ]);

  if (!edhrec.data && !card) {
    notFound();
  }

  const profile = edhrec.data;
  const displayName = card?.name ?? profile!.name;
  const typeLine = card?.typeLine ?? "Legendary Creature";

  if (!profile && card) {
    return (
      <PageShell
        title={displayName}
        description={typeLine}
        breadcrumbs={[
          { label: "Commanders", href: "/commanders" },
          { label: displayName, href: `/commanders/${slug}` },
        ]}
      >
        <EntityDetailTabs slug={slug} activeRoute="commander" />

        <section className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div>
            {card.imageUri ? (
              <CardImage src={card.imageUri} alt={displayName} variant="detail" />
            ) : (
              <div className="flex aspect-[488/680] w-full max-w-[260px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                No image available
              </div>
            )}
          </div>

          <div className="space-y-5">
            <MetaUnavailableNotice context="commander-page" />

            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Stats
              </h2>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                CMC {card.cmc} · {formatColorIdentity(card.colorIdentity)}
                {card.isCommander ? " · Commander" : ""}
              </p>
            </section>

            {card.oracleText && (
              <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Oracle text
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-800 dark:text-zinc-200">
                  {card.oracleText}
                </p>
              </section>
            )}

            {card.keywords.length > 0 && (
              <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Keywords
                </h2>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {card.keywords.join(", ")}
                </p>
              </section>
            )}
          </div>
        </section>
      </PageShell>
    );
  }

  const cardlists = (profile!.cardlists ?? {}) as Record<string, EdhrecCardList>;
  const tagCounts = (profile!.tagCounts ?? {}) as Record<string, number>;

  return (
    <PageShell
      title={displayName}
      description={typeLine}
      breadcrumbs={[
        { label: "Commanders", href: "/commanders" },
        { label: displayName, href: `/commanders/${slug}` },
      ]}
    >
      {edhrec.isStale && edhrec.syncedAt && (
        <div className="mb-6">
          <StaleCacheBanner syncedAt={edhrec.syncedAt} context="page" />
        </div>
      )}

      <EntityDetailTabs slug={slug} activeRoute="commander" />

      <section className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div>
          {card?.imageUri ? (
            <CardImage src={card.imageUri} alt={displayName} variant="detail" />
          ) : (
            <div className="flex aspect-[488/680] w-full max-w-[260px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              No image available
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Popularity
            </h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              Rank {formatRank(profile!.rank)} · Salt{" "}
              {profile!.salt != null ? profile!.salt.toFixed(2) : "—"}
              {profile!.numDecks != null
                ? ` · ${profile!.numDecks.toLocaleString()} decks`
                : ""}
              {" · "}
              {formatColorIdentity(profile!.colorIdentity)}
            </p>
          </section>

          {card?.oracleText && (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Oracle text
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-800 dark:text-zinc-200">
                {card.oracleText}
              </p>
            </section>
          )}

          {card && card.keywords.length > 0 && (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Keywords
              </h2>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {card.keywords.join(", ")}
              </p>
            </section>
          )}

          <EdhrecThemes tagCounts={tagCounts} />
          <EdhrecTopCards cardlists={cardlists} numDecks={profile!.numDecks} />
          <EdhrecSimilarCommanders similarSlugs={profile!.similarSlugs} />
        </div>
      </section>
    </PageShell>
  );
}
