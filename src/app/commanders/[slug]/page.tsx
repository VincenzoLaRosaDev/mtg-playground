import { permanentRedirect } from "next/navigation";

import { buildCardVersionHref } from "@/lib/scryfall/card-printing";

type CommanderDetailRedirectProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ set?: string; cn?: string; finish?: string }>;
};

/**
 * Phase 2.0.4 — single oracle detail at `/cards/{slug}`.
 * Keep this route as a permanent redirect for old bookmarks / sitemap links.
 */
export default async function CommanderDetailRedirect({
  params,
  searchParams,
}: CommanderDetailRedirectProps) {
  const { slug } = await params;
  const { set, cn, finish } = await searchParams;
  permanentRedirect(buildCardVersionHref(slug, { set, cn, finish }));
}
