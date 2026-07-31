import type {
  HairTryOnInput,
  HairTryOnCreateResult,
  HairTryOnProvider,
} from "@/domain/ai/hair-try-on-provider";

export class MockHairProvider implements HairTryOnProvider {
  readonly name = "mock";

  async createPrediction(
    _input: HairTryOnInput,
  ): Promise<HairTryOnCreateResult> {
    return {
      externalId: `mock-${crypto.randomUUID()}`,
      reportedModelVersion: "mock-v1",
    };
  }
}