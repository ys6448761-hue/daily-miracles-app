/**
 * Experiment Auto-Evaluation System — Pure Statistics
 * Zero external dependencies.
 */

/**
 * Normal CDF — Abramowitz & Stegun 26.2.17.
 * Max error < 7.5e-8.
 */
export function normalCdf(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const erf =
    1 -
    (a1 * t +
      a2 * t ** 2 +
      a3 * t ** 3 +
      a4 * t ** 4 +
      a5 * t ** 5) *
      Math.exp(-x * x);

  return 0.5 * (1 + sign * erf);
}

/**
 * Chi-square CDF.
 *  df=2  → exact: 1 - exp(-x/2)
 *  df>2  → Wilson-Hilferty normal approximation
 */
export function chiSquareCdf(x: number, df: number): number {
  if (x <= 0) return 0;
  if (df === 2) return 1 - Math.exp(-x / 2);

  // Wilson-Hilferty
  const z = Math.cbrt(x / df) - (1 - 2 / (9 * df));
  const denom = Math.sqrt(2 / (9 * df));
  return normalCdf(z / denom);
}

/**
 * Two-proportion z-test (pooled SE, two-sided).
 */
export function twoProportionZTest(
  x1: number,
  n1: number,
  x2: number,
  n2: number,
): { z: number; pValue: number } {
  if (n1 === 0 || n2 === 0) return { z: 0, pValue: 1 };

  const pPool = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, pValue: 1 };

  const z = (x1 / n1 - x2 / n2) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  return { z, pValue };
}

/**
 * Wilson score interval (95% CI for a proportion).
 */
export function wilsonInterval(
  successes: number,
  trials: number,
): [number, number] {
  if (trials === 0) return [0, 0];

  const z = 1.96;
  const p = successes / trials;
  const denom = 1 + (z * z) / trials;
  const centre = p + (z * z) / (2 * trials);
  const margin =
    z * Math.sqrt((p * (1 - p) + (z * z) / (4 * trials)) / trials);

  return [
    Math.max(0, (centre - margin) / denom),
    Math.min(1, (centre + margin) / denom),
  ];
}

/**
 * Sample Ratio Mismatch test — chi-square goodness of fit.
 * Expected: uniform 1/k per arm.
 */
export function srmTest(
  observed: number[],
): { chiSq: number; pValue: number; df: number } {
  const total = observed.reduce((s, v) => s + v, 0);
  const k = observed.length;
  if (total === 0 || k < 2) return { chiSq: 0, pValue: 1, df: Math.max(k - 1, 1) };

  const expected = total / k;
  const chiSq = observed.reduce((s, o) => s + (o - expected) ** 2 / expected, 0);
  const df = k - 1;
  const pValue = 1 - chiSquareCdf(chiSq, df);

  return { chiSq, pValue, df };
}
