#!/usr/bin/env node
/**
 * Recompute summary + D-04B proposal from a benchmark result JSON.
 * Usage: node scripts/ai-benchmark/aggregate-results.mjs benchmark-results/matrix-48-<runId>.json
 * Self-test: node scripts/ai-benchmark/aggregate-results.mjs --self-test
 */
import path from "node:path";
import { readBenchmarkEnv } from "./lib/config.mjs";
import { loadGoldenAggregation } from "./lib/fixtures.mjs";
import {
  buildRunSummary,
  verifyGoldenAggregation,
} from "./lib/aggregate.mjs";
import { readRunResult, writeRunResult } from "./lib/record-io.mjs";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      "Usage: node scripts/ai-benchmark/aggregate-results.mjs <result.json|--self-test>",
    );
    process.exit(1);
  }

  if (arg === "--self-test") {
    const golden = await loadGoldenAggregation();
    await verifyGoldenAggregation(golden);
    console.info("[ai-benchmark] golden aggregation self-test passed");
    return;
  }

  const env = readBenchmarkEnv();
  const filePath = path.resolve(arg);
  const run = await readRunResult(filePath);
  run.summary = buildRunSummary(run, env);
  await writeRunResult(filePath, run);

  console.info(JSON.stringify(run.summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
