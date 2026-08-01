import fs from "node:fs/promises";
import path from "node:path";
import { RESULTS_DIR } from "./config.mjs";

export async function ensureResultsDir() {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
}

export function resultPath(phase, runId) {
  return path.join(RESULTS_DIR, `${phase}-${runId}.json`);
}

export async function writeRunResult(filePath, run) {
  await ensureResultsDir();
  await fs.writeFile(filePath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
}

export async function readRunResult(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export function newRunId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return stamp;
}

export function pendingGeneration({ id, photoId, hairstyleSlug, mode }) {
  return {
    id,
    photoId,
    hairstyleSlug,
    status: "PENDING",
    mode,
    latencyMs: null,
    costUsd: null,
    teachable: null,
    weightedScore: null,
  };
}

export function isoNow() {
  return new Date().toISOString();
}
