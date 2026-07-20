export type CatalogPriceCurrency = "EUR" | "USD";

/** Display + browse/sort currency. Scryfall `eur*` comes from Cardmarket. */
export const CATALOG_PRICE_CURRENCY: CatalogPriceCurrency = "EUR";

export type ScryfallPrices = {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
  eur?: string | null;
  eur_foil?: string | null;
  eur_etched?: string | null;
};

export function parseScryfallPrices(prices: unknown): ScryfallPrices | null {
  if (!prices || typeof prices !== "object") {
    return null;
  }

  const record = prices as Record<string, unknown>;

  return {
    usd: typeof record.usd === "string" ? record.usd : null,
    usd_foil: typeof record.usd_foil === "string" ? record.usd_foil : null,
    usd_etched: typeof record.usd_etched === "string" ? record.usd_etched : null,
    eur: typeof record.eur === "string" ? record.eur : null,
    eur_foil: typeof record.eur_foil === "string" ? record.eur_foil : null,
    eur_etched: typeof record.eur_etched === "string" ? record.eur_etched : null,
  };
}

function formatMoneyAmount(
  value: string | null | undefined,
  currency: CatalogPriceCurrency,
): string | null {
  if (!value) {
    return null;
  }

  const amount = Number.parseFloat(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** @deprecated Use formatCatalogAmount — kept for call-site clarity during migration. */
export function formatUsdAmount(value: string | null | undefined): string | null {
  return formatMoneyAmount(value, "USD");
}

export function formatEurAmount(value: string | null | undefined): string | null {
  return formatMoneyAmount(value, "EUR");
}

export function formatCatalogAmount(value: string | null | undefined): string | null {
  return formatMoneyAmount(value, CATALOG_PRICE_CURRENCY);
}

/**
 * Pick regular / foil string amounts for the catalog currency, falling back to USD
 * when Scryfall has no EUR for that finish.
 */
export function pickCatalogPriceStrings(prices: unknown): {
  regular: string | null;
  foil: string | null;
  currency: CatalogPriceCurrency;
} {
  const parsed = parseScryfallPrices(prices);
  if (!parsed) {
    return { regular: null, foil: null, currency: CATALOG_PRICE_CURRENCY };
  }

  if (CATALOG_PRICE_CURRENCY === "EUR") {
    const eurRegular = parsed.eur ?? null;
    const eurFoil = parsed.eur_foil ?? parsed.eur_etched ?? null;
    if (eurRegular || eurFoil) {
      return {
        regular: eurRegular,
        foil: eurFoil,
        currency: "EUR",
      };
    }
  }

  return {
    regular: parsed.usd ?? null,
    foil: parsed.usd_foil ?? parsed.usd_etched ?? null,
    currency: "USD",
  };
}

export type CardPriceLabels = {
  regular: string | null;
  foil: string | null;
  currency: CatalogPriceCurrency;
};

export function getCardPriceLabels(prices: unknown): CardPriceLabels {
  const picked = pickCatalogPriceStrings(prices);
  return {
    regular: formatMoneyAmount(picked.regular, picked.currency),
    foil: formatMoneyAmount(picked.foil, picked.currency),
    currency: picked.currency,
  };
}

/** Numeric regular price for browse sort / bands (EUR-first, USD fallback). */
export function parseCatalogListPrice(prices: unknown): number | null {
  const picked = pickCatalogPriceStrings(prices);
  if (!picked.regular) {
    return null;
  }
  const value = Number.parseFloat(picked.regular);
  return Number.isFinite(value) ? value : null;
}
