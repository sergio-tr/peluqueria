import {
  BENCHMARK_WEIGHTS,
  TEACHABLE_PASS_PERCENT,
} from "./config.mjs";

const MAX_DIMENSION_SCORE = 5;
const DIMENSIONS = Object.keys(BENCHMARK_WEIGHTS);

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function weightedBenchmarkScore(scores) {
  let total = 0;
  for (const dimension of DIMENSIONS) {
    const value = scores[dimension];
    if (!Number.isFinite(value) || value < 0 || value > MAX_DIMENSION_SCORE) {
      throw new RangeError(`Invalid score for ${dimension}: ${value}`);
    }
    total += (value / MAX_DIMENSION_SCORE) * BENCHMARK_WEIGHTS[dimension];
  }
  return round(total, 2);
}

export function teachablePercent(teachableCount, total) {
  if (total <= 0) return 0;
  return round((teachableCount / total) * 100, 2);
}

export function passesTeachableThreshold(teachableCount, total) {
  return teachablePercent(teachableCount, total) >= TEACHABLE_PASS_PERCENT;
}

export function percentile(values, p) {
  if (values.length === 0) {
    throw new RangeError("percentile requires at least one value");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const index = Math.min(Math.max(rank, 0), sorted.length - 1);
  return round(sorted[index], 6);
}

export function median(values) {
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

export function latencyCostStats(samples) {
  const latencies = samples
    .map((s) => s.latencyMs)
    .filter((v) => v != null && Number.isFinite(v) && v >= 0);
  const costs = samples
    .map((s) => s.costUsd)
    .filter((v) => v != null && Number.isFinite(v) && v >= 0);

  return {
    latencyMsP50: latencies.length > 0 ? median(latencies) : null,
    latencyMsP95: latencies.length > 0 ? percentile(latencies, 95) : null,
    costUsdP50: costs.length > 0 ? median(costs) : null,
    costUsdP95: costs.length > 0 ? percentile(costs, 95) : null,
    sampleCount: samples.length,
  };
}

export function aggregateRunSummary(generations) {
  const total = generations.length;
  const teachableCount = generations.filter((g) => g.teachable === true).length;
  const scored = generations
    .map((g) => g.weightedScore)
    .filter((v) => v != null && Number.isFinite(v));

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

export function proposeD04bMonthlyCap({ p95CostUsd, budgetEur, eurUsdRate }) {
  if (p95CostUsd == null || !Number.isFinite(p95CostUsd) || p95CostUsd <= 0) {
    return {
      status: "PENDING_BENCHMARK",
      proposedMonthlyGenCap: null,
      p95CostUsd: null,
      p95CostEur: null,
      rationale:
        "D-04B cap remains PENDING_BENCHMARK until definitive benchmark supplies p95 cost per generation.",
    };
  }

  const p95CostEur = p95CostUsd / eurUsdRate;
  const proposedMonthlyGenCap = Math.max(
    1,
    Math.floor(budgetEur / p95CostEur),
  );

  return {
    status: "PROPOSED",
    proposedMonthlyGenCap,
    p95CostUsd: round(p95CostUsd, 6),
    p95CostEur: round(p95CostEur, 6),
    rationale: `floor(${budgetEur} EUR / ${round(p95CostEur, 4)} EUR p95 per gen) = ${proposedMonthlyGenCap} gens/month`,
  };
}

export function buildRunSummary(run, env) {
  const teachableSummary = aggregateRunSummary(run.generations);
  const succeeded = run.generations.filter((g) => g.status === "SUCCEEDED");
  const timing = latencyCostStats(succeeded);
  const d04b = proposeD04bMonthlyCap({
    p95CostUsd: timing.costUsdP95,
    budgetEur: env.budgetEur,
    eurUsdRate: env.eurUsdRate,
  });

  return {
    ...teachableSummary,
    ...timing,
    d04b,
  };
}

export async function verifyGoldenAggregation(golden) {
  for (const testCase of golden.cases) {
    const actual = weightedBenchmarkScore(testCase.scores);
    if (actual !== testCase.expectedWeightedScore) {
      throw new Error(
        `golden ${testCase.name}: expected ${testCase.expectedWeightedScore}, got ${actual}`,
      );
    }
  }

  for (const testCase of golden.teachable) {
    const percent = teachablePercent(testCase.teachableCount, testCase.total);
    const pass = passesTeachableThreshold(
      testCase.teachableCount,
      testCase.total,
    );
    if (percent !== testCase.expectedPercent) {
      throw new Error(
        `golden teachable ${testCase.teachableCount}/${testCase.total}: expected ${testCase.expectedPercent}%, got ${percent}%`,
      );
    }
    if (pass !== testCase.expectedPass) {
      throw new Error(
        `golden teachable pass mismatch for ${testCase.teachableCount}/${testCase.total}`,
      );
    }
  }

  for (const testCase of golden.percentile) {
    const p95 = percentile(testCase.values, 95);
    const p50 = median(testCase.values);
    if (p95 !== testCase.p95 || p50 !== testCase.p50) {
      throw new Error("golden percentile mismatch");
    }
  }
}
