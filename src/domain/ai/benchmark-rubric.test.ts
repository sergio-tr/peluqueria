import { describe, expect, it } from "vitest";
import {
  aggregateRunSummary,
  BENCHMARK_WEIGHTS,
  DEFINITIVE_MATRIX_GENERATIONS,
  latencyCostStats,
  median,
  percentile,
  passesTeachableThreshold,
  SMOKE_GATE_GENERATIONS,
  teachablePercent,
  weightedBenchmarkScore,
} from "@/domain/ai/benchmark-rubric";

const perfectScores = {
  identity: 5,
  fidelity: 5,
  realism: 5,
  deformations: 5,
  latency: 5,
  cost: 5,
} as const;

describe("benchmark rubric weights (ADR-016)", () => {
  it("sums to 100%", () => {
    const sum = Object.values(BENCHMARK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it("smoke gate is 16 and definitive matrix is 48 (6×8)", () => {
    expect(SMOKE_GATE_GENERATIONS).toBe(16);
    expect(DEFINITIVE_MATRIX_GENERATIONS).toBe(48);
  });
});

describe("weightedBenchmarkScore", () => {
  it("returns 100 for perfect scores", () => {
    expect(weightedBenchmarkScore(perfectScores)).toBe(100);
  });

  it("returns 0 for zero scores", () => {
    expect(
      weightedBenchmarkScore({
        identity: 0,
        fidelity: 0,
        realism: 0,
        deformations: 0,
        latency: 0,
        cost: 0,
      }),
    ).toBe(0);
  });

  it("applies 30/25/20/10/10/5 weights", () => {
    const onlyIdentity = weightedBenchmarkScore({
      ...perfectScores,
      fidelity: 0,
      realism: 0,
      deformations: 0,
      latency: 0,
      cost: 0,
    });
    expect(onlyIdentity).toBe(30);

    const mixed = weightedBenchmarkScore({
      identity: 5,
      fidelity: 4,
      realism: 3,
      deformations: 2,
      latency: 1,
      cost: 0,
    });
    expect(mixed).toBe(68);
  });

  it("rejects out-of-range scores", () => {
    expect(() =>
      weightedBenchmarkScore({ ...perfectScores, identity: 6 }),
    ).toThrow(RangeError);
  });
});

describe("teachable threshold (C-09 ≥80%)", () => {
  it("computes teachable percent", () => {
    expect(teachablePercent(8, 10)).toBe(80);
    expect(teachablePercent(7, 10)).toBe(70);
  });

  it("passes at 80% for smoke 16 (13/16)", () => {
    expect(passesTeachableThreshold(13, 16)).toBe(true);
    expect(passesTeachableThreshold(12, 16)).toBe(false);
  });

  it("passes at 80% for matrix 48 (39/48)", () => {
    expect(passesTeachableThreshold(39, 48)).toBe(true);
    expect(passesTeachableThreshold(38, 48)).toBe(false);
  });
});

describe("aggregateRunSummary", () => {
  it("aggregates teachable counts and mean weighted score", () => {
    const summary = aggregateRunSummary({
      generations: [
        { teachable: true, weightedScore: 90 },
        { teachable: true, weightedScore: 80 },
        { teachable: false, weightedScore: 40 },
        { teachable: false, weightedScore: null },
      ],
    });
    expect(summary.total).toBe(4);
    expect(summary.teachableCount).toBe(2);
    expect(summary.teachablePercent).toBe(50);
    expect(summary.passesTeachableThreshold).toBe(false);
    expect(summary.meanWeightedScore).toBe(70);
  });
});

describe("latencyCostStats", () => {
  it("computes p50 and p95", () => {
    const stats = latencyCostStats([
      { latencyMs: 1000, costUsd: 0.02 },
      { latencyMs: 2000, costUsd: 0.03 },
      { latencyMs: 3000, costUsd: 0.04 },
      { latencyMs: 4000, costUsd: 0.05 },
      { latencyMs: 5000, costUsd: 0.06 },
    ]);
    expect(stats.latencyMsP50).toBe(3000);
    expect(stats.latencyMsP95).toBe(5000);
    expect(stats.costUsdP50).toBe(0.04);
    expect(stats.costUsdP95).toBe(0.06);
    expect(stats.sampleCount).toBe(5);
  });
});

describe("percentile helpers", () => {
  it("median of even count averages middle pair", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("p95 uses nearest-rank", () => {
    expect(percentile([10, 20, 30, 40, 50], 95)).toBe(50);
  });
});
