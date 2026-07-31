import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUsageCount = vi.fn();
const mockHasActiveJobForSession = vi.fn();

vi.mock("@/infrastructure/persistence/repositories/ai-usage", () => ({
  getUsageCount: (...args: unknown[]) => mockGetUsageCount(...args),
  bumpUsage: vi.fn(async () => true),
  dayKey: () => "2026-07-31",
  monthKey: () => "2026-07",
}));

vi.mock("@/infrastructure/persistence/repositories/ai-jobs", () => ({
  hasActiveJobForSession: (...args: unknown[]) => mockHasActiveJobForSession(...args),
}));

import { enforceAiLimits } from "@/application/ai/ai-limits";

describe("enforceAiLimits retry path", () => {
  beforeEach(() => {
    vi.stubEnv("AI_GENERATION_ENABLED", "true");
    vi.stubEnv("AI_MAX_GENERATIONS_PER_SESSION", "3");
    vi.stubEnv("AI_MONTHLY_BUDGET_EUR", "30");
    mockGetUsageCount.mockReset();
    mockHasActiveJobForSession.mockReset();
    mockHasActiveJobForSession.mockResolvedValue(false);
  });

  it("blocks retry when session limit already reached", async () => {
    mockGetUsageCount.mockImplementation(
      async (_client, _salonId, periodType, _periodKey, _ipHash, sessionId) => {
        if (periodType === "month") return 0;
        if (periodType === "session" && sessionId === "sess-1") return 3;
        if (periodType === "day") return 0;
        return 0;
      },
    );

    await expect(
      enforceAiLimits({} as never, "salon-1", {
        sessionId: "sess-1",
        ipHash: "ip-hash",
        skipUsageBump: true,
      }),
    ).rejects.toMatchObject({ code: "SESSION_LIMIT" });
  });
});
