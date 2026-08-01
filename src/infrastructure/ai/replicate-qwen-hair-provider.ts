import { AppError } from "@/domain/errors";
import type {
  HairTryOnCreateResult,
  HairTryOnInput,
  HairTryOnProvider,
} from "@/domain/ai/hair-try-on-provider";
import { parseReplicateModel } from "@/infrastructure/ai/runtime-env";

type ReplicatePrediction = {
  id: string;
  version?: string;
  model?: string;
  error?: string;
  detail?: string;
};

export class ReplicateQwenHairProvider implements HairTryOnProvider {
  readonly name = "replicate-qwen";

  constructor(
    private readonly token: string,
    private readonly model: string,
  ) {}

  async createPrediction(
    input: HairTryOnInput,
  ): Promise<HairTryOnCreateResult> {
    const { modelOwner, modelName } = parseReplicateModel(this.model);
    const endpoint = `https://api.replicate.com/v1/models/${modelOwner}/${modelName}/predictions`;

    // qwen-image-edit-plus expects `image` as an array of URIs (source + reference).
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Prefer: "respond-async",
      },
      body: JSON.stringify({
        input: {
          image: [input.sourceImageUrl, input.referenceImageUrl],
          prompt: input.prompt,
          go_fast: true,
          aspect_ratio: "match_input_image",
          output_format: "jpg",
        },
        webhook: input.webhookUrl,
        webhook_events_filter: ["completed"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[replicate-create-failed]", response.status, errText.slice(0, 500));
      if (response.status === 402) {
        throw new AppError(
          "AI_BUDGET_EXCEEDED",
          "No hay crédito suficiente en Replicate para generar. Revisa la facturación de la cuenta.",
          503,
        );
      }
      throw new AppError(
        "REPLICATE_CREATE_FAILED",
        "No se pudo iniciar la generación.",
        502,
      );
    }

    const data = (await response.json()) as ReplicatePrediction;
    return {
      externalId: data.id,
      reportedModelVersion: data.version ?? data.model,
    };
  }
}
