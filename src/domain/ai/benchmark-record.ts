import { z } from "zod";
import { BENCHMARK_DIMENSIONS } from "@/domain/ai/benchmark-rubric";

const dimensionScoreSchema = z.number().min(0).max(5);

const dimensionScoresSchema = z.object(
  Object.fromEntries(
    BENCHMARK_DIMENSIONS.map((d) => [d, dimensionScoreSchema]),
  ) as Record<(typeof BENCHMARK_DIMENSIONS)[number], typeof dimensionScoreSchema>,
);

export const benchmarkGenerationSchema = z.object({
  id: z.string().min(1),
  photoId: z.string().min(1),
  hairstyleSlug: z.string().min(1),
  status: z.enum(["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "SKIPPED"]),
  mode: z.enum(["live", "dry-run"]),
  externalPredictionId: z.string().optional(),
  latencyMs: z.number().nonnegative().nullable().optional(),
  costUsd: z.number().nonnegative().nullable().optional(),
  error: z.string().optional(),
  teachable: z.boolean().nullable().optional(),
  dimensionScores: dimensionScoresSchema.partial().optional(),
  weightedScore: z.number().min(0).max(100).nullable().optional(),
  reviewedAt: z.string().datetime().optional(),
  outputPath: z.string().optional(),
});

export const benchmarkRunSchema = z.object({
  runId: z.string().min(1),
  phase: z.enum(["smoke-16", "matrix-48"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETE", "FAILED"]),
  mode: z.enum(["live", "dry-run"]),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  assetVersion: z.string().min(1),
  generations: z.array(benchmarkGenerationSchema),
  summary: z
    .object({
      total: z.number().int().nonnegative(),
      teachableCount: z.number().int().nonnegative(),
      teachablePercent: z.number().min(0).max(100),
      passesTeachableThreshold: z.boolean(),
      meanWeightedScore: z.number().min(0).max(100).nullable(),
      latencyMsP50: z.number().nullable().optional(),
      latencyMsP95: z.number().nullable().optional(),
      costUsdP50: z.number().nullable().optional(),
      costUsdP95: z.number().nullable().optional(),
      d04b: z.object({
        status: z.enum(["PENDING_BENCHMARK", "PROPOSED"]),
        proposedMonthlyGenCap: z.number().int().positive().nullable(),
        p95CostUsd: z.number().nullable(),
        p95CostEur: z.number().nullable(),
        rationale: z.string(),
      }),
    })
    .optional(),
});

export type BenchmarkGeneration = z.infer<typeof benchmarkGenerationSchema>;
export type BenchmarkRun = z.infer<typeof benchmarkRunSchema>;

export function parseBenchmarkRun(raw: unknown): BenchmarkRun {
  return benchmarkRunSchema.parse(raw);
}
