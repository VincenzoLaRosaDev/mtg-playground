import type {
  EdhrecCardList,
  EdhrecCardPage,
  EdhrecCardView,
  EdhrecCommanderPage,
  EdhrecListEntry,
} from "@/lib/edhrec/types";

const USER_AGENT = "EDHForge/1.0 (+https://github.com/VincenzoLaRosaDev/edhforge)";
const EDHREC_JSON_BASE = "https://json.edhrec.com";
const EDHREC_SITE_BASE = "https://edhrec.com";


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<T>;
}

import {
  fetchCardTopEntries,
  fetchCommanderTopEntries,
} from "@/lib/edhrec/top-index";

type NextDataPayload = {
  props?: {
    pageProps?: {
      data?: {
        container?: {
          json_dict?: {
            cardlists?: Record<string, { cardviews?: EdhrecCardView[] }>;
          };
        };
      };
    };
  };
};

async function fetchTopFromSite(path: string, maxCount: number): Promise<EdhrecListEntry[]> {
  const response = await fetch(`${EDHREC_SITE_BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`EDHREC index failed (${path}): ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`EDHREC index missing __NEXT_DATA__ (${path})`);
  }

  const nextData = JSON.parse(match[1]) as NextDataPayload;
  const cardlists =
    nextData.props?.pageProps?.data?.container?.json_dict?.cardlists ?? {};

  const entries: EdhrecListEntry[] = [];
  const seen = new Set<string>();

  for (const list of Object.values(cardlists)) {
    for (const view of list.cardviews ?? []) {
      if (!view.sanitized || seen.has(view.sanitized)) {
        continue;
      }

      seen.add(view.sanitized);
      entries.push({
        slug: view.sanitized,
        name: view.name,
        rank: view.rank ?? null,
      });
    }
  }

  return entries
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .slice(0, maxCount);
}

export async function fetchTopCommandersFromJson(maxCount: number) {
  const entries = await fetchCommanderTopEntries("year");
  return entries.slice(0, maxCount).map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    rank: entry.rank,
  }));
}

export async function fetchTopCardsFromJson(maxCount: number) {
  const entries = await fetchCardTopEntries("year");
  return entries.slice(0, maxCount).map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    rank: entry.rank,
  }));
}

export async function fetchTopCommandersFromSite(maxCount: number) {
  return fetchTopFromSite("/commanders", maxCount);
}

export async function fetchTopCardsFromSite(maxCount: number) {
  return fetchTopFromSite("/cards", maxCount);
}

export async function fetchCommanderPage(slug: string): Promise<EdhrecCommanderPage | null> {
  return fetchJson<EdhrecCommanderPage>(
    `${EDHREC_JSON_BASE}/pages/commanders/${encodeURIComponent(slug)}.json`,
  );
}

export async function fetchCardPage(slug: string): Promise<EdhrecCardPage | null> {
  return fetchJson<EdhrecCardPage>(
    `${EDHREC_JSON_BASE}/pages/cards/${encodeURIComponent(slug)}.json`,
  );
}

export function extractCardSlugsFromCardlists(
  cardlists: Record<string, EdhrecCardList>,
): EdhrecListEntry[] {
  const entries: EdhrecListEntry[] = [];
  const seen = new Set<string>();

  for (const list of Object.values(cardlists)) {
    for (const view of list.cardviews ?? []) {
      if (!view.sanitized || seen.has(view.sanitized)) {
        continue;
      }

      seen.add(view.sanitized);
      entries.push({
        slug: view.sanitized,
        name: view.name,
        rank: view.rank ?? null,
      });
    }
  }

  return entries;
}

export async function rateLimitPause(ms = 1000) {
  await sleep(ms);
}
