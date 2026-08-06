import type { Metadata } from "next";

export const SITE_NAME = "MTGPlayground";

const DEFAULT_DESCRIPTION =
  "Magic: The Gathering catalog, personal collection, and multi-format deck builder — browse cards, sets, and precons from Scryfall and MTGJSON.";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

/** Site-wide fallback social preview — src/app/opengraph-image.tsx only auto-applies to `/`. */
export function getDefaultOgImageUrl(): string {
  return `${getSiteUrl()}/opengraph-image`;
}

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const resolvedImage = image ?? getDefaultOgImageUrl();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: resolvedImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [resolvedImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — MTG catalog & decks`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  icons: {
    icon: "/mtgplayground-favicon-tile.svg",
    shortcut: "/mtgplayground-favicon-tile.svg",
    apple: "/mtgplayground-favicon-tile.svg",
  },
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: [getDefaultOgImageUrl()],
  },
};
