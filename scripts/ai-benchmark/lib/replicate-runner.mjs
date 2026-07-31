import fs from "node:fs/promises";
import path from "node:path";
import { assertNotSvgReference } from "./config.mjs";
import { defaultPrompt } from "./fixtures.mjs";

async function fileToDataUri(absPath) {
  const buffer = await fs.readFile(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runReplicateGeneration({
  env,
  sourceAbsPath,
  referenceAbsPath,
  prompt,
}) {
  if (!env.token) {
    throw new Error("REPLICATE_API_TOKEN required for live benchmark run");
  }

  assertNotSvgReference(referenceAbsPath);

  const [sourceImage, referenceImage] = await Promise.all([
    fileToDataUri(sourceAbsPath),
    fileToDataUri(referenceAbsPath),
  ]);

  const started = Date.now();
  const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${env.token}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      model: env.model,
      input: {
        image: sourceImage,
        image_2: referenceImage,
        prompt,
      },
    }),
  });

  if (!createResponse.ok) {
    const body = await createResponse.text();
    throw new Error(
      `Replicate create failed (${createResponse.status}): ${body.slice(0, 300)}`,
    );
  }

  let prediction = await createResponse.json();
  const deadline = started + env.pollTimeoutMs;

  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  ) {
    if (Date.now() > deadline) {
      throw new Error(
        `Replicate poll timeout after ${env.pollTimeoutMs}ms (id=${prediction.id})`,
      );
    }
    await sleep(env.pollIntervalMs);
    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: { Authorization: `Token ${env.token}` },
      },
    );
    if (!pollResponse.ok) {
      throw new Error(`Replicate poll failed (${pollResponse.status})`);
    }
    prediction = await pollResponse.json();
  }

  const latencyMs = Date.now() - started;

  if (prediction.status !== "succeeded") {
    return {
      externalPredictionId: prediction.id,
      latencyMs,
      costUsd: null,
      error: prediction.error || `Prediction ${prediction.status}`,
      outputUrl: null,
    };
  }

  const metrics = prediction.metrics ?? {};
  const costUsd =
    typeof metrics.predict_time === "number"
      ? Number(process.env.AI_ESTIMATED_COST_PER_OUTPUT_USD || 0.03)
      : Number(process.env.AI_ESTIMATED_COST_PER_OUTPUT_USD || 0.03);

  const output = Array.isArray(prediction.output)
    ? prediction.output[0]
    : prediction.output;

  return {
    externalPredictionId: prediction.id,
    latencyMs,
    costUsd,
    error: null,
    outputUrl: typeof output === "string" ? output : null,
  };
}

export function resolveAbsPaths(repoRoot, photo, hairstyle) {
  const sourceAbsPath = path.join(repoRoot, photo.localPath);
  const referenceAbsPath = path.join(repoRoot, hairstyle.aiReferencePath);
  return { sourceAbsPath, referenceAbsPath };
}

export async function assertLocalFilesExist(paths) {
  for (const filePath of paths) {
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Missing benchmark fixture file: ${filePath}`);
    }
  }
}

export { defaultPrompt };
