import type {
  HairTryOnCreateResult,
  HairTryOnInput,
  HairTryOnProvider,
} from "@/domain/ai/hair-try-on-provider";

/** Local/CI/contingency only. Results must be labeled "Demostración" in UI. */
export class MockHairProvider implements HairTryOnProvider {
  readonly name = "mock";

  async createPrediction(
    input: HairTryOnInput,
  ): Promise<HairTryOnCreateResult> {
    void input;
    return {
      externalId: `mock_${crypto.randomUUID()}`,
      reportedModelVersion: "mock-1",
    };
  }
}
