import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.join(__dirname, "..", "..", "..");
export const BENCHMARK_DIR = path.join(REPO_ROOT, "scripts", "ai-benchmark");
export const RESULTS_DIR = path.join(REPO_ROOT, "benchmark-results");
export const FIXTURES_DIR = path.join(BENCHMARK_DIR, "fixtures");
export const MANIFEST_PATH = path.join(FIXTURES_DIR, "manifest.json");

export const BENCHMARK_WEIGHTS = {
  identity: 30,
  fidelity: 25,
  realism: 20,
  deformations: 10,
  latency: 10,
  cost: 5,
};

export const TEACHABLE_PASS_PERCENT = 80;
export const DEFAULT_MODEL = "qwen/qwen-image-edit-plus";
export const DEFAULT_PROMPT_VERSION = "v1-2026-07-30";

export function readBenchmarkEnv() {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  const mode = token ? "live" : "dry-run";
  const baseUrl = (
    process.env.BENCHMARK_BASE_URL ||
    process.env.WEBHOOK_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  return {
    token,
    mode,
    model: process.env.REPLICATE_MODEL || DEFAULT_MODEL,
    promptVersion: process.env.PROMPT_VERSION || DEFAULT_PROMPT_VERSION,
    assetVersion:
      process.env.HAIRSTYLE_ASSET_VERSION || "1.0.0-synthetic-mvp",
    baseUrl,
    budgetEur: Number(process.env.AI_MONTHLY_BUDGET_EUR || 30),
    eurUsdRate: Number(process.env.AI_EUR_USD_RATE || 1.08),
    pollIntervalMs: Number(process.env.BENCHMARK_POLL_MS || 2000),
    pollTimeoutMs: Number(process.env.BENCHMARK_POLL_TIMEOUT_MS || 120000),
  };
}

export function assertNotSvgReference(referencePath) {
  if (referencePath.toLowerCase().endsWith(".svg")) {
    throw new Error(
      `SVG ai_reference is invalid for benchmark (ADR-016): ${referencePath}`,
    );
  }
}
