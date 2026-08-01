import type {
  HairTryOnCreateResult,
  HairTryOnInput,
  HairTryOnProvider,
} from "@/domain/ai/hair-try-on-provider";

/** Local/CI/contingency only. Results must be labeled "Demostración" in UI. */
export class MockHairProvider implements HairTryOnProvider {
  readonly name: string;

  constructor(name: "mock" | "local-demo" = "mock") {
    this.name = name;
  }

  async createPrediction(
    input: HairTryOnInput,
  ): Promise<HairTryOnCreateResult> {
    void input;
    return {
      externalId: `${this.name}_${crypto.randomUUID()}`,
      reportedModelVersion: `${this.name}-1`,
    };
  }
}
