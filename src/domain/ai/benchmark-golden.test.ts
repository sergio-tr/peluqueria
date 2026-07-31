import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  aggregateRunSummary,
  weightedBenchmarkScore,
} from "@/domain/ai/benchmark-rubric";
import { proposeD04bMonthlyCap } from "@/domain/ai/benchmark-d04b";

const goldenPath = path.join(
  process.cwd(),
  "scripts/ai-benchmark/fixtures/golden-aggregation.json",
);

describe("golden aggregation fixtures (script parity)", () => {
  const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8")) as {
    cases: Array<{
      name: string;
      scores: Record<string, number>;
      expectedWeightedScore: number;
    }>;
    teachable: Array<{
      teachableCount: number;
      total: number;
      expectedPercent: number;
      expectedPass: boolean;
    }>;
  };

  for (const testCase of golden.cases) {
    it(`weighted score: ${testCase.name}`, () => {
      expect(weightedBenchmarkScore(testCase.scores as never)).toBe(
        testCase.expectedWeightedScore,
      );
    });
  }

  for (const testCase of golden.teachable) {
    it(`teachable ${testCase.teachableCount}/${testCase.total}`, () => {
      const generations = Array.from({ length: testCase.total }, (_, i) => ({
        teachable: i < testCase.teachableCount,
        weightedScore: null as number | null,
      }));
      const summary = aggregateRunSummary({ generations });
      expect(summary.teachablePercent).toBe(testCase.expectedPercent);
      expect(summary.passesTeachableThreshold).toBe(testCase.expectedPass);
    });
  }

  it("D-04B stays pending without p95", () => {
    expect(proposeD04bMonthlyCap({ p95CostUsd: null }).status).toBe(
      "PENDING_BENCHMARK",
    );
  });
});
