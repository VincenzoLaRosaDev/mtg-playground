import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CommanderCardlistSections } from "@/components/discovery/commander-cardlist-sections";
import { CommanderFilterBar } from "@/components/discovery/commander-filter-bar";
import { DetailHeroAside } from "@/components/discovery/detail-hero-aside";
import { DetailSectionPanel } from "@/components/discovery/detail-section-panel";
import { FilterUnavailableNotice } from "@/components/discovery/filter-unavailable-notice";
import { EdhrecAverageDeck } from "@/components/discovery/edhrec-average-deck";
import { EdhrecSimilarCommanders } from "@/components/discovery/edhrec-similar-commanders";
import { EdhrecThemes } from "@/components/discovery/edhrec-themes";
import { EntityDetailTabs } from "@/components/discovery/entity-detail-tabs";
import { MetaUnavailableNotice } from "@/components/discovery/meta-unavailable-notice";
import { PriceChip } from "@/components/discovery/price-chip";
import { StaleCacheBanner } from "@/components/discovery/stale-cache-banner";
import { PageShell } from "@/components/layout/page-shell";
import { getCachedCommanderProfile } from "@/lib/edhrec/cache";
import {
  parseAverageDeckSections,
  parseCommanderCardlists,
  splitTagCounts,
} from "@/lib/edhrec/cardlists";
import {
  getUnsupportedCommanderFilterMessage,
  parseBracketFilterParam,
  parseBudgetFilterParam,
  parseThemeFilterParam,
} from "@/lib/edhrec/filter-options";
import { getCommanderDetailData } from "@/lib/edhrec/variant-cache";
import { commanderAllTimeRank } from "@/lib/edhrec/commander-rank";
import { hasActivePageFilters } from "@/lib/edhrec/variants";
import { prisma } from "@/lib/db";
import { findPlayableCardByEdhrecSlug } from "@/lib/scryfall/catalog-filters";
import { CardStatsLine } from "@/components/discovery/card-stats-line";
import { ColorIdentity } from "@/components/mtg/color-identity";
import { buildCommanderDetailNavItems, commanderCardlistSectionsForNav } from "@/lib/ui/detail-section-nav";
import { DETAIL_HERO_GRID_CLASS, DETAIL_MAIN_COLUMN_CLASS } from "@/lib/ui/layout";
import { createPageMetadata } from "@/lib/seo/site";

type CommanderDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string; budget?: string; bracket?: string }>;
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
  prices: true,
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

export default async function CommanderDetailPage({
  params,
  searchParams,
}: CommanderDetailPageProps) {
  const { slug } = await params;
  const { theme, budget, bracket } = await searchParams;

  const filters = {
    theme: parseThemeFilterParam(theme),
    budget: parseBudgetFilterParam(budget),
    bracket: parseBracketFilterParam(bracket),
  };

  const [baseEdhrec, detail, card] = await Promise.all([
    getCachedCommanderProfile(slug, { warm: true }),
    getCommanderDetailData(slug, { warm: true, filters }),
    findPlayableCardByEdhrecSlug(prisma, slug, cardSelect),
  ]);

  if (!baseEdhrec.data && !detail.data && !card) {
    notFound();
  }

  const profile = detail.data;
  const hasFilters = hasActivePageFilters(filters);
  const filterUnavailableMessage = getUnsupportedCommanderFilterMessage(filters);
  const displayName = card?.name ?? profile?.name ?? baseEdhrec.data?.name ?? slug;
  const typeLine = card?.typeLine ?? "Legendary Creature";
  const allTimeRank = commanderAllTimeRank(baseEdhrec.data);
  const baseTagCounts = (baseEdhrec.data?.tagCounts ?? {}) as Record<string, number>;
  const themeOptions = splitTagCounts(baseTagCounts)
    .themes.map((entry) => entry.name)
    .slice(0, 40);

  if (!profile && hasFilters && (baseEdhrec.data || card)) {
    return (
      <PageShell
        title={displayName}
        description={typeLine}
        breadcrumbs={[
          { label: "Top commanders", href: "/commanders" },
          { label: displayName, href: `/commanders/${slug}` },
        ]}
      >
        {detail.isStale && detail.syncedAt && (
          <div className="mb-6">
            <StaleCacheBanner syncedAt={detail.syncedAt} context="page" />
          </div>
        )}

        <EntityDetailTabs slug={slug} activeRoute="commander" />

        <section className={DETAIL_HERO_GRID_CLASS}>
          <DetailHeroAside
            imageUri={card?.imageUri ?? null}
            imageAlt={displayName}
            rank={allTimeRank}
            salt={baseEdhrec.data?.salt ?? null}
            allTimeRank
          />

          <div className={DETAIL_MAIN_COLUMN_CLASS}>
            <Suspense fallback={null}>
              <CommanderFilterBar
                themeOptions={themeOptions}
                activeTheme={filters.theme}
                activeBudget={filters.budget}
                activeBracket={filters.bracket}
              />
            </Suspense>

            <FilterUnavailableNotice message={filterUnavailableMessage ?? undefined} />

            {card && (
              <DetailSectionPanel title="Stats">
                <CardStatsLine
                  cmc={card.cmc}
                  colorIdentity={card.colorIdentity}
                  isCommander={card.isCommander}
                  className="mt-2"
                />
                <div className="mt-2">
                  <PriceChip prices={card.prices} />
                </div>
              </DetailSectionPanel>
            )}

            {card?.oracleText && (
              <DetailSectionPanel title="Oracle text">
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">
                  {card.oracleText}
                </p>
              </DetailSectionPanel>
            )}

            {card && card.keywords.length > 0 && (
              <DetailSectionPanel title="Keywords">
                <p className="mt-2 text-sm text-muted-foreground">{card.keywords.join(", ")}</p>
              </DetailSectionPanel>
            )}
          </div>
        </section>
      </PageShell>
    );
  }

  if (!profile && card) {
    return (
      <PageShell
        title={displayName}
        description={typeLine}
        breadcrumbs={[
          { label: "Top commanders", href: "/commanders" },
          { label: displayName, href: `/commanders/${slug}` },
        ]}
      >
        <EntityDetailTabs slug={slug} activeRoute="commander" />

        <section className={DETAIL_HERO_GRID_CLASS}>
          <DetailHeroAside
            imageUri={card.imageUri}
            imageAlt={displayName}
            rank={allTimeRank}
            allTimeRank
          />

          <div className={DETAIL_MAIN_COLUMN_CLASS}>
            <MetaUnavailableNotice context="commander-page" />

            <DetailSectionPanel title="Stats">
              <CardStatsLine
                cmc={card.cmc}
                colorIdentity={card.colorIdentity}
                isCommander={card.isCommander}
                className="mt-2"
              />
              <div className="mt-2">
                <PriceChip prices={card.prices} />
              </div>
            </DetailSectionPanel>

            {card.oracleText && (
              <DetailSectionPanel title="Oracle text">
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">
                  {card.oracleText}
                </p>
              </DetailSectionPanel>
            )}

            {card.keywords.length > 0 && (
              <DetailSectionPanel title="Keywords">
                <p className="mt-2 text-sm text-muted-foreground">{card.keywords.join(", ")}</p>
              </DetailSectionPanel>
            )}
          </div>
        </section>
      </PageShell>
    );
  }

  if (!profile) {
    notFound();
  }

  const cardlists = profile.cardlists;
  const tagCounts = profile.tagCounts;
  const colorIdentity =
    profile.colorIdentity.length > 0
      ? profile.colorIdentity
      : (card?.colorIdentity ?? []);
  const themeSplit = splitTagCounts(tagCounts);
  const commanderCardlistSections = commanderCardlistSectionsForNav(
    cardlists,
    parseCommanderCardlists(cardlists),
  );
  const sectionNavItems = buildCommanderDetailNavItems({
    hasThemes: themeSplit.themes.length > 0 || themeSplit.kindred.length > 0,
    cardlistSections: commanderCardlistSections,
    hasAverageDeck: parseAverageDeckSections(cardlists).length > 0,
    hasSimilarCommanders: profile.similarSlugs.length > 0,
  });

  return (
    <PageShell
      title={displayName}
      description={typeLine}
      breadcrumbs={[
        { label: "Top commanders", href: "/commanders" },
        { label: displayName, href: `/commanders/${slug}` },
      ]}
    >
      {detail.isStale && detail.syncedAt && (
        <div className="mb-6">
          <StaleCacheBanner syncedAt={detail.syncedAt} context="page" />
        </div>
      )}

      <EntityDetailTabs slug={slug} activeRoute="commander" />

      <section className={DETAIL_HERO_GRID_CLASS}>
        <DetailHeroAside
          imageUri={card?.imageUri ?? null}
          imageAlt={displayName}
          rank={allTimeRank}
          salt={profile.salt}
          allTimeRank
          sectionNavItems={sectionNavItems}
        />

        <div className={DETAIL_MAIN_COLUMN_CLASS}>
          <Suspense fallback={null}>
            <CommanderFilterBar
              themeOptions={themeOptions}
              activeTheme={filters.theme}
              activeBudget={filters.budget}
              activeBracket={filters.bracket}
            />
          </Suspense>

          {card && (
            <DetailSectionPanel title="Stats">
              <CardStatsLine
                cmc={card.cmc}
                colorIdentity={card.colorIdentity}
                isCommander={card.isCommander}
                className="mt-2"
              />
              <div className="mt-2">
                <PriceChip prices={card.prices} />
              </div>
            </DetailSectionPanel>
          )}

          <DetailSectionPanel title="Popularity">
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground">
              <span>
                {profile.numDecks != null
                  ? `${profile.numDecks.toLocaleString()} decks`
                  : "Deck count unavailable"}
              </span>
              {!card && colorIdentity.length > 0 ? (
                <ColorIdentity colors={colorIdentity} size="sm" />
              ) : null}
            </p>
          </DetailSectionPanel>

          {card?.oracleText && (
            <DetailSectionPanel title="Oracle text">
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">
                {card.oracleText}
              </p>
            </DetailSectionPanel>
          )}

          {card && card.keywords.length > 0 && (
            <DetailSectionPanel title="Keywords">
              <p className="mt-2 text-sm text-muted-foreground">{card.keywords.join(", ")}</p>
            </DetailSectionPanel>
          )}

          <EdhrecThemes tagCounts={tagCounts} />
          <CommanderCardlistSections
            cardlists={cardlists}
            numDecks={profile.numDecks}
            partition="unique"
          />
          <EdhrecAverageDeck cardlists={cardlists} numDecks={profile.numDecks} />
          <EdhrecSimilarCommanders similarSlugs={profile.similarSlugs} />
          <CommanderCardlistSections
            cardlists={cardlists}
            numDecks={profile.numDecks}
            partition="shared"
          />
        </div>
      </section>
    </PageShell>
  );
}
