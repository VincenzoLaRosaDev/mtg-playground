/**
 * Hypergeometric draw odds for deck stats (Archidekt Probability tab lite).
 */

export type HypergeometricMode = "atLeast" | "exactly";

/**
 * Probability of drawing at least `atLeast` successes in `draws` cards
 * from a deck of `deckSize` with `successes` matching cards.
 * Returns 0–100 (percent), or null when inputs are invalid.
 */
export function hypergeometricAtLeastPercent(input: {
  deckSize: number;
  successes: number;
  draws: number;
  atLeast?: number;
}): number | null {
  const deckSize = Math.floor(input.deckSize);
  const successes = Math.floor(input.successes);
  const draws = Math.floor(input.draws);
  const atLeast = Math.floor(input.atLeast ?? 1);

  if (deckSize < 1 || draws < 1 || successes < 0 || atLeast < 1) return null;
  if (draws > deckSize) return null;
  if (successes === 0) return 0;
  if (atLeast > successes || atLeast > draws) return 0;

  // P(X >= k) = 1 - P(X <= k-1)
  let cdf = 0;
  const maxFail = Math.min(atLeast - 1, draws);
  for (let x = 0; x <= maxFail; x++) {
    const p = hypergeometricPmf(deckSize, successes, draws, x);
    if (p == null) return null;
    cdf += p;
  }
  return roundPercent((1 - cdf) * 100);
}

/**
 * Probability of drawing exactly `exactly` successes in `draws` cards.
 * Returns 0–100 (percent), or null when inputs are invalid.
 */
export function hypergeometricExactlyPercent(input: {
  deckSize: number;
  successes: number;
  draws: number;
  exactly: number;
}): number | null {
  const deckSize = Math.floor(input.deckSize);
  const successes = Math.floor(input.successes);
  const draws = Math.floor(input.draws);
  const exactly = Math.floor(input.exactly);

  if (deckSize < 1 || draws < 1 || successes < 0 || exactly < 0) return null;
  if (draws > deckSize) return null;
  if (exactly === 0 && successes === 0) return 100;
  if (exactly > successes || exactly > draws) return 0;

  const p = hypergeometricPmf(deckSize, successes, draws, exactly);
  if (p == null) return null;
  return roundPercent(p * 100);
}

export function hypergeometricPercent(input: {
  mode: HypergeometricMode;
  deckSize: number;
  successes: number;
  draws: number;
  target: number;
}): number | null {
  if (input.mode === "exactly") {
    return hypergeometricExactlyPercent({
      deckSize: input.deckSize,
      successes: input.successes,
      draws: input.draws,
      exactly: input.target,
    });
  }
  return hypergeometricAtLeastPercent({
    deckSize: input.deckSize,
    successes: input.successes,
    draws: input.draws,
    atLeast: input.target,
  });
}

function roundPercent(pct: number): number {
  return Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10;
}

/** P(X = k) for hypergeometric. */
export function hypergeometricPmf(
  deckSize: number,
  successes: number,
  draws: number,
  k: number,
): number | null {
  if (k < 0 || k > draws || k > successes) return 0;
  if (draws - k > deckSize - successes) return 0;
  const num = combinations(successes, k) * combinations(deckSize - successes, draws - k);
  const den = combinations(deckSize, draws);
  if (den === 0) return null;
  return num / den;
}

/** n choose k (multiplicative formula, stable for deck sizes ~100). */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= kk; i++) {
    result *= n - kk + i;
    result /= i;
  }
  return result;
}
