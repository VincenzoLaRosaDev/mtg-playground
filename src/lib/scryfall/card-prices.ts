export type ScryfallPrices = {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
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
  };
}

export function formatUsdAmount(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const amount = Number.parseFloat(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount < 1 ? 2 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type CardPriceLabels = {
  regular: string | null;
  foil: string | null;
};

export function getCardPriceLabels(prices: unknown): CardPriceLabels {
  const parsed = parseScryfallPrices(prices);

  if (!parsed) {
    return { regular: null, foil: null };
  }

  return {
    regular: formatUsdAmount(parsed.usd),
    foil: formatUsdAmount(parsed.usd_foil ?? parsed.usd_etched),
  };
}
