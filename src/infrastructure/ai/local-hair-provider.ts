import { AppError } from "@/domain/errors";
import type {
  HairTryOnCreateResult,
  HairTryOnInput,
  HairTryOnProvider,
} from "@/domain/ai/hair-try-on-provider";

/**
 * Calls the local GPU sidecar (tools/local-hair-server).
 * createPrediction only reserves an id; create-ai-job runs the sync edit.
 */
export class LocalHairProvider implements HairTryOnProvider {
  readonly name = "local-hair";

  constructor(private readonly baseUrl: string) {}

  async createPrediction(
    input: HairTryOnInput,
  ): Promise<HairTryOnCreateResult> {
    void input;
    // Health check early so the UI fails fast if the sidecar is down.
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        throw new Error(`health_${res.status}`);
      }
      const body = (await res.json()) as { ok?: boolean };
      if (!body.ok) {
        throw new Error("cuda_unavailable");
      }
    } catch {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "Servidor local de IA no disponible. Arranca tools/local-hair-server (start.ps1).",
        503,
      );
    }

    return {
      externalId: `local_hair_${crypto.randomUUID()}`,
      reportedModelVersion: "local-sd-inpaint-1",
    };
  }
}

export function resolveLocalHairBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (env.LOCAL_HAIR_URL ?? "http://127.0.0.1:7860").replace(/\/$/, "");
}
