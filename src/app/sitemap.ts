import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/seo/site";

export const revalidate = 86_400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/cards`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/commanders`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/sets`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const [commanders, cards, sets] = await Promise.all([
    prisma.edhrecCommanderProfile.findMany({
      where: { rank: { not: null } },
      select: { slug: true, syncedAt: true },
      orderBy: { rank: "asc" },
    }),
    prisma.edhrecCardData.findMany({
      select: { slug: true, syncedAt: true },
      orderBy: { syncedAt: "desc" },
    }),
    prisma.mtgSet.findMany({
      select: { code: true, syncedAt: true },
      orderBy: { releasedAt: "desc" },
    }),
  ]);

  const commanderRoutes: MetadataRoute.Sitemap = commanders.map((commander) => ({
    url: `${baseUrl}/commanders/${commander.slug}`,
    lastModified: commander.syncedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const cardRoutes: MetadataRoute.Sitemap = cards.map((card) => ({
    url: `${baseUrl}/cards/${card.slug}`,
    lastModified: card.syncedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const setRoutes: MetadataRoute.Sitemap = sets.map((set) => ({
    url: `${baseUrl}/sets/${set.code}`,
    lastModified: set.syncedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...commanderRoutes, ...cardRoutes, ...setRoutes];
}
