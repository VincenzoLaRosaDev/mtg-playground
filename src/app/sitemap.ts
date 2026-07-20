import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";
import { getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
export const revalidate = 86_400;

/** Cap detail URLs; prefer lower inclusion rank when populated. */
const SITEMAP_CARD_LIMIT = 8_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/browse`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/sets`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const [cards, sets] = await Promise.all([
    prisma.card.findMany({
      where: {
        ...playableCatalogCardWhere,
        slug: { not: null },
      },
      select: { slug: true, syncedAt: true },
      orderBy: [{ popularityRank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
      take: SITEMAP_CARD_LIMIT,
    }),
    prisma.mtgSet.findMany({
      select: { code: true, syncedAt: true },
      orderBy: { releasedAt: "desc" },
    }),
  ]);

  const cardRoutes: MetadataRoute.Sitemap = cards
    .filter((row): row is typeof row & { slug: string } => Boolean(row.slug))
    .map((card) => ({
      url: `${baseUrl}/cards/${card.slug}`,
      lastModified: card.syncedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const setRoutes: MetadataRoute.Sitemap = sets.map((set) => ({
    url: `${baseUrl}/sets/${set.code}`,
    lastModified: set.syncedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...cardRoutes, ...setRoutes];
}
