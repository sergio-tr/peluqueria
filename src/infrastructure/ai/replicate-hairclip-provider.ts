import { AppError } from "@/domain/errors";
import type {
  HairTryOnCreateResult,
  HairTryOnInput,
  HairTryOnProvider,
} from "@/domain/ai/hair-try-on-provider";
import {
  HAIRCLIP_DEFAULT_VERSION,
  hairclipDescriptionForSlug,
} from "@/infrastructure/ai/hairclip-style-map";

type ReplicatePrediction = {
  id: string;
  version?: string;
  model?: string;
};

export class ReplicateHairclipProvider implements HairTryOnProvider {
  readonly name = "replicate-hairclip";

  constructor(
    private readonly token: string,
    private readonly version: string = HAIRCLIP_DEFAULT_VERSION,
  ) {}

  async createPrediction(
    input: HairTryOnInput & { hairstyleSlug?: string },
  ): Promise<HairTryOnCreateResult> {
    const slug = input.hairstyleSlug ?? "";
    const hairstyleDescription = hairclipDescriptionForSlug(slug);

    // Legacy Cog models use /v1/predictions + version id (not models/.../predictions).
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Prefer: "respond-async",
      },
      body: JSON.stringify({
        version: this.version,
        input: {
          image: input.sourceImageUrl,
          editing_type: "hairstyle",
          hairstyle_description: hairstyleDescription,
        },
        webhook: input.webhookUrl,
        webhook_events_filter: ["completed"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[hairclip-create-failed]", response.status, errText.slice(0, 500));
      if (response.status === 402) {
        throw new AppError(
          "AI_BUDGET_EXCEEDED",
          "No hay crédito suficiente en Replicate (~0,05 USD/corte con HairCLIP).",
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
      reportedModelVersion: data.version ?? this.version,
    };
  }
}
