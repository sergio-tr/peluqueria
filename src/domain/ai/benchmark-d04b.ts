import { readAiLimitsConfig } from "@/application/ai/ai-limits";

export type D04bCapProposalStatus = "PENDING_BENCHMARK" | "PROPOSED";

export type D04bCapProposal = {
  status: D04bCapProposalStatus;
  budgetEur: number;
  p95CostEur: number | null;
  eurUsdRate: number;
  p95CostUsd: number | null;
  proposedMonthlyGenCap: number | null;
  rationale: string;
};

export type ProposeD04bCapInput = {
  p95CostUsd: number | null;
  budgetEur?: number;
  eurUsdRate?: number;
};

/**
 * Hook for D-04B: derive a monthly generation cap from measured p95 cost per output.
 * Remains PENDING_BENCHMARK until a real benchmark run supplies p95CostUsd.
 */
export function proposeD04bMonthlyCap(
  input: ProposeD04bCapInput,
): D04bCapProposal {
  const config = readAiLimitsConfig();
  const budgetEur = input.budgetEur ?? config.budgetEur;
  const eurUsdRate = input.eurUsdRate ?? config.eurUsdRate;

  if (
    input.p95CostUsd == null ||
    !Number.isFinite(input.p95CostUsd) ||
    input.p95CostUsd <= 0
  ) {
    return {
      status: "PENDING_BENCHMARK",
      budgetEur,
      p95CostEur: null,
      eurUsdRate,
      p95CostUsd: null,
      proposedMonthlyGenCap: null,
      rationale:
        "D-04B cap remains PENDING_BENCHMARK until definitive benchmark supplies p95 cost per generation.",
    };
  }

  const p95CostEur = input.p95CostUsd / eurUsdRate;
  const proposedMonthlyGenCap = Math.max(1, Math.floor(budgetEur / p95CostEur));

  return {
    status: "PROPOSED",
    budgetEur,
    p95CostEur: round(p95CostEur, 6),
    eurUsdRate,
    p95CostUsd: round(input.p95CostUsd, 6),
    proposedMonthlyGenCap,
    rationale: `floor(${budgetEur} EUR / ${round(p95CostEur, 4)} EUR p95 per gen) = ${proposedMonthlyGenCap} gens/month`,
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
