#!/usr/bin/env node
/**
 * Smoke gate: 16 generations (ADR-016 early sanity check only).
 * Live mode requires REPLICATE_API_TOKEN and local subject photos under benchmark-fixtures/.
 * Without token: dry-run writes PENDING records (no Replicate calls).
 */
import path from "node:path";
import { readBenchmarkEnv, REPO_ROOT } from "./lib/config.mjs";
import {
  buildGenerationId,
  loadManifest,
  resolveHairstyle,
  resolvePhoto,
} from "./lib/fixtures.mjs";
import { buildRunSummary } from "./lib/aggregate.mjs";
import {
  isoNow,
  newRunId,
  pendingGeneration,
  resultPath,
  writeRunResult,
} from "./lib/record-io.mjs";
import {
  assertLocalFilesExist,
  defaultPrompt,
  resolveAbsPaths,
  runReplicateGeneration,
} from "./lib/replicate-runner.mjs";

async function main() {
  const env = readBenchmarkEnv();
  const manifest = await loadManifest();
  const runId = newRunId();
  const outfile = resultPath("smoke-16", runId);

  if (manifest.smoke16.length !== 16) {
    throw new Error(`smoke16 must contain 16 pairs, got ${manifest.smoke16.length}`);
  }

  console.info(`[ai-benchmark] phase=smoke-16 mode=${env.mode} runId=${runId}`);

  if (env.mode === "dry-run") {
    console.info(
      "[ai-benchmark] REPLICATE_API_TOKEN not set — dry-run only; all generations PENDING",
    );
  }

  const generations = [];

  for (const pair of manifest.smoke16) {
    const id = buildGenerationId(pair.photoId, pair.hairstyleSlug);
    const photo = resolvePhoto(manifest, pair.photoId);
    const hairstyle = resolveHairstyle(manifest, pair.hairstyleSlug);
    const { sourceAbsPath, referenceAbsPath } = resolveAbsPaths(
      REPO_ROOT,
      photo,
      hairstyle,
    );

    if (env.mode === "dry-run") {
      generations.push(
        pendingGeneration({
          id,
          photoId: pair.photoId,
          hairstyleSlug: pair.hairstyleSlug,
          mode: "dry-run",
        }),
      );
      continue;
    }

    await assertLocalFilesExist([sourceAbsPath, referenceAbsPath]);

    const gen = pendingGeneration({
      id,
      photoId: pair.photoId,
      hairstyleSlug: pair.hairstyleSlug,
      mode: "live",
    });
    gen.status = "RUNNING";

    try {
      const result = await runReplicateGeneration({
        env,
        sourceAbsPath,
        referenceAbsPath,
        prompt: defaultPrompt(),
      });
      gen.externalPredictionId = result.externalPredictionId;
      gen.latencyMs = result.latencyMs;
      gen.costUsd = result.costUsd;
      gen.status = result.error ? "FAILED" : "SUCCEEDED";
      gen.error = result.error ?? undefined;
      gen.outputPath = result.outputUrl
        ? path.relative(REPO_ROOT, result.outputUrl)
        : undefined;
    } catch (error) {
      gen.status = "FAILED";
      gen.error = error instanceof Error ? error.message : String(error);
    }

    generations.push(gen);
    console.info(
      `[ai-benchmark] ${id} status=${gen.status} latencyMs=${gen.latencyMs ?? "—"}`,
    );
  }

  const run = {
    runId,
    phase: "smoke-16",
    status: env.mode === "dry-run" ? "PENDING" : "COMPLETE",
    mode: env.mode,
    startedAt: isoNow(),
    finishedAt: isoNow(),
    model: env.model,
    promptVersion: env.promptVersion,
    assetVersion: env.assetVersion,
    generations,
  };

  run.summary = buildRunSummary(run, env);
  await writeRunResult(outfile, run);

  console.info(`[ai-benchmark] wrote ${outfile}`);
  console.info(
    `[ai-benchmark] d04b=${run.summary.d04b.status} cap=${run.summary.d04b.proposedMonthlyGenCap ?? "PENDING"}`,
  );

  if (env.mode === "dry-run") {
    console.info(
      "[ai-benchmark] Next: set REPLICATE_API_TOKEN, add photos to benchmark-fixtures/photos/, rerun",
    );
    process.exitCode = 0;
    return;
  }

  const structuralFailures = generations.filter((g) => g.status === "FAILED");
  if (structuralFailures.length > 0) {
    console.error(
      `[ai-benchmark] smoke gate blocked: ${structuralFailures.length} structural failures`,
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
