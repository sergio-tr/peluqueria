import { describe, expect, it } from "vitest";
import { proposeD04bMonthlyCap } from "@/domain/ai/benchmark-d04b";

describe("proposeD04bMonthlyCap (D-04B hook)", () => {
  it("stays PENDING_BENCHMARK without p95 cost", () => {
    const proposal = proposeD04bMonthlyCap({ p95CostUsd: null });
    expect(proposal.status).toBe("PENDING_BENCHMARK");
    expect(proposal.proposedMonthlyGenCap).toBeNull();
    expect(proposal.rationale).toContain("PENDING_BENCHMARK");
  });

  it("proposes cap from p95 cost and 30 EUR budget", () => {
    const proposal = proposeD04bMonthlyCap({
      p95CostUsd: 0.03,
      budgetEur: 30,
      eurUsdRate: 1.08,
    });
    expect(proposal.status).toBe("PROPOSED");
    expect(proposal.p95CostUsd).toBe(0.03);
    expect(proposal.p95CostEur).toBeCloseTo(0.03 / 1.08, 5);
    expect(proposal.proposedMonthlyGenCap).toBe(
      Math.floor(30 / (0.03 / 1.08)),
    );
  });

  it("rejects non-positive p95", () => {
    const proposal = proposeD04bMonthlyCap({ p95CostUsd: 0 });
    expect(proposal.status).toBe("PENDING_BENCHMARK");
  });
});
