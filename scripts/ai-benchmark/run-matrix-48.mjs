#!/usr/bin/env node
/**
 * Definitive benchmark: 6 photos × 8 hairstyles = 48 generations (C-09).
 * Run only after smoke-16 gate passes with production 2D assets.
 * Default: dry-run without REPLICATE_API_TOKEN (records PENDING).
 */
import { readBenchmarkEnv, REPO_ROOT } from "./lib/config.mjs";
import {
  buildGenerationId,
  expandMatrix48,
  loadManifest,
  resolveHairstyle,
  resolvePhoto,
} from "./lib/fixtures.mjs";
import { buildRunSummary } from "./lib/aggregate.mjs";
import {
  isoNow,
  newRunId,
  pendingGeneration,
  readRunResult,
  resultPath,
  writeRunResult,
} from "./lib/record-io.mjs";
import {
  assertLocalFilesExist,
  defaultPrompt,
  resolveAbsPaths,
  runReplicateGeneration,
} from "./lib/replicate-runner.mjs";

function parseArgs(argv) {
  const args = { requireSmokePass: false, smokeResult: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--require-smoke-pass") {
      args.requireSmokePass = true;
    }
    if (argv[i] === "--smoke-result" && argv[i + 1]) {
      args.smokeResult = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function assertSmokeGatePassed(smokeResultPath) {
  const run = await readRunResult(smokeResultPath);
  if (run.phase !== "smoke-16") {
    throw new Error(`Expected smoke-16 result, got ${run.phase}`);
  }
  const failures = run.generations.filter((g) => g.status === "FAILED");
  if (failures.length > 0) {
    throw new Error(
      `Smoke gate has ${failures.length} structural failures — matrix-48 blocked`,
    );
  }
  if (run.mode === "dry-run" || run.status === "PENDING") {
    throw new Error(
      "Smoke result is dry-run/PENDING — definitive 48-run requires live smoke pass first",
    );
  }
}

async function main() {
  const env = readBenchmarkEnv();
  const args = parseArgs(process.argv);
  const manifest = await loadManifest();
  const matrix = expandMatrix48(manifest);
  const runId = newRunId();
  const outfile = resultPath("matrix-48", runId);

  if (args.requireSmokePass) {
    if (!args.smokeResult) {
      throw new Error("--require-smoke-pass requires --smoke-result <path>");
    }
    await assertSmokeGatePassed(args.smokeResult);
    console.info(`[ai-benchmark] smoke gate OK: ${args.smokeResult}`);
  }

  console.info(`[ai-benchmark] phase=matrix-48 mode=${env.mode} runId=${runId}`);

  if (env.mode === "dry-run") {
    console.info(
      "[ai-benchmark] REPLICATE_API_TOKEN not set — dry-run only; 48 generations PENDING (NOT EXECUTED)",
    );
  }

  const generations = [];

  for (const pair of matrix) {
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
    } catch (error) {
      gen.status = "FAILED";
      gen.error = error instanceof Error ? error.message : String(error);
    }

    generations.push(gen);
    console.info(
      `[ai-benchmark] ${id} status=${gen.status} (${generations.length}/48)`,
    );
  }

  const run = {
    runId,
    phase: "matrix-48",
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
    `[ai-benchmark] teachable=${run.summary.teachablePercent}% d04b=${run.summary.d04b.status}`,
  );

  if (env.mode === "dry-run") {
    console.info(
      "[ai-benchmark] Definitive 48-run NOT EXECUTED — awaiting operator credentials and fixtures",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
