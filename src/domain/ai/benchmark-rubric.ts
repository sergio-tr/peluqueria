/** ADR-016 / C-09 — benchmark scoring weights (percent of weighted total). */
export const BENCHMARK_WEIGHTS = {
  identity: 30,
  fidelity: 25,
  realism: 20,
  deformations: 10,
  latency: 10,
  cost: 5,
} as const;

export type BenchmarkDimension = keyof typeof BENCHMARK_WEIGHTS;

export const BENCHMARK_DIMENSIONS = Object.keys(
  BENCHMARK_WEIGHTS,
) as BenchmarkDimension[];

/** Human rubric scores per dimension (0–5 inclusive). */
export type BenchmarkDimensionScores = Record<BenchmarkDimension, number>;

export const TEACHABLE_PASS_PERCENT = 80;

export const SMOKE_GATE_GENERATIONS = 16;
export const DEFINITIVE_MATRIX_GENERATIONS = 48;
export const DEFINITIVE_PHOTO_COUNT = 6;
export const DEFINITIVE_HAIRSTYLE_COUNT = 8;

const MAX_DIMENSION_SCORE = 5;

export function assertValidDimensionScore(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > MAX_DIMENSION_SCORE) {
    throw new RangeError(
      `Dimension score must be between 0 and ${MAX_DIMENSION_SCORE}, got ${value}`,
    );
  }
}

export function normalizeDimensionScore(value: number): number {
  assertValidDimensionScore(value);
  return value / MAX_DIMENSION_SCORE;
}

/** Weighted total on a 0–100 scale. */
export function weightedBenchmarkScore(
  scores: BenchmarkDimensionScores,
): number {
  let total = 0;
  for (const dimension of BENCHMARK_DIMENSIONS) {
    assertValidDimensionScore(scores[dimension]);
    total +=
      normalizeDimensionScore(scores[dimension]) * BENCHMARK_WEIGHTS[dimension];
  }
  return round(total, 2);
}

export function teachablePercent(teachableCount: number, total: number): number {
  if (total <= 0) return 0;
  return round((teachableCount / total) * 100, 2);
}

export function passesTeachableThreshold(
  teachableCount: number,
  total: number,
  thresholdPercent: number = TEACHABLE_PASS_PERCENT,
): boolean {
  return teachablePercent(teachableCount, total) >= thresholdPercent;
}

export function aggregateRunSummary(input: {
  generations: Array<{ teachable: boolean; weightedScore?: number | null }>;
}): {
  total: number;
  teachableCount: number;
  teachablePercent: number;
  passesTeachableThreshold: boolean;
  meanWeightedScore: number | null;
} {
  const total = input.generations.length;
  const teachableCount = input.generations.filter((g) => g.teachable).length;
  const scored = input.generations
    .map((g) => g.weightedScore)
    .filter((v): v is number => v != null && Number.isFinite(v));

  return {
    total,
    teachableCount,
    teachablePercent: teachablePercent(teachableCount, total),
    passesTeachableThreshold: passesTeachableThreshold(teachableCount, total),
    meanWeightedScore:
      scored.length > 0
        ? round(scored.reduce((a, b) => a + b, 0) / scored.length, 2)
        : null,
  };
}

/** Nearest-rank p95 (requires at least one sample). */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new RangeError("percentile requires at least one value");
  }
  if (p < 0 || p > 100) {
    throw new RangeError("percentile must be between 0 and 100");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const index = Math.min(Math.max(rank, 0), sorted.length - 1);
  return round(sorted[index], 6);
}

export function median(values: number[]): number {
  if (values.length === 0) {
    throw new RangeError("median requires at least one value");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return round((sorted[mid - 1] + sorted[mid]) / 2, 6);
  }
  return round(sorted[mid], 6);
}

export type LatencyCostStats = {
  latencyMsP50: number | null;
  latencyMsP95: number | null;
  costUsdP50: number | null;
  costUsdP95: number | null;
  sampleCount: number;
};

export function latencyCostStats(
  samples: Array<{ latencyMs?: number | null; costUsd?: number | null }>,
): LatencyCostStats {
  const latencies = samples
    .map((s) => s.latencyMs)
    .filter((v): v is number => v != null && Number.isFinite(v) && v >= 0);
  const costs = samples
    .map((s) => s.costUsd)
    .filter((v): v is number => v != null && Number.isFinite(v) && v >= 0);

  return {
    latencyMsP50: latencies.length > 0 ? median(latencies) : null,
    latencyMsP95: latencies.length > 0 ? percentile(latencies, 95) : null,
    costUsdP50: costs.length > 0 ? median(costs) : null,
    costUsdP95: costs.length > 0 ? percentile(costs, 95) : null,
    sampleCount: samples.length,
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
