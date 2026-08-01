import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  budgetAlertHooks,
  budgetPercent,
  crossedBudgetThreshold,
  emitBudgetAlert,
  readAiLimitsConfig,
} from "@/application/ai/ai-limits";

describe("ai-limits budget alerts", () => {
  beforeEach(() => {
    budgetAlertHooks.length = 0;
  });

  it("detects threshold crossings", () => {
    expect(crossedBudgetThreshold(65, 72)).toBe(70);
    expect(crossedBudgetThreshold(85, 92)).toBe(90);
    expect(crossedBudgetThreshold(95, 100)).toBe(100);
    expect(crossedBudgetThreshold(72, 75)).toBeNull();
  });

  it("emits alert hooks and logs", () => {
    const events: Array<{ threshold: number }> = [];
    budgetAlertHooks.push((event) => {
      events.push(event);
    });
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    emitBudgetAlert({ threshold: 70, spentEur: 21, budgetEur: 30 });

    expect(events).toHaveLength(1);
    expect(events[0]?.threshold).toBe(70);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ai-budget-alert] threshold=70"),
    );

    logSpy.mockRestore();
  });

  it("computes budget percent", () => {
    expect(budgetPercent(15, 30)).toBe(50);
    expect(budgetPercent(30, 30)).toBe(100);
  });
});

describe("readAiLimitsConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults monthly budget to 30 EUR (D-04A)", () => {
    vi.stubEnv("AI_MONTHLY_BUDGET_EUR", "");
    const config = readAiLimitsConfig();
    expect(config.budgetEur).toBe(30);
  });
});
