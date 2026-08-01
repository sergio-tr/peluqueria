import { AppError } from "@/domain/errors";
import type {
  HairTryOnCreateResult,
  HairTryOnInput,
  HairTryOnProvider,
} from "@/domain/ai/hair-try-on-provider";

type ReplicatePrediction = {
  id: string;
  version?: string;
  model?: string;
  error?: string;
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
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${this.token}`,
        "Content-Type": "application/json",
        Prefer: "respond-async",
      },
      body: JSON.stringify({
        model: this.model,
        input: {
          image: input.sourceImageUrl,
          image_2: input.referenceImageUrl,
          prompt: input.prompt,
        },
        webhook: input.webhookUrl,
        webhook_events_filter: ["completed"],
      }),
    });

    if (!response.ok) {
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
