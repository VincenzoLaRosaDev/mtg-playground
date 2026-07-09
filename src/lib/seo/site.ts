import type { Metadata } from "next";

export const SITE_NAME = "EDHForge";

const DEFAULT_DESCRIPTION =
  "Commander deck discovery and tools — browse cards, commanders, and sets with EDHREC meta from your local cache.";

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
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title} | ${SITE_NAME}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — Commander deck tools`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
};
