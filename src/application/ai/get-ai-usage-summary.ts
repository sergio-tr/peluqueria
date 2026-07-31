import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMonthlySpendEur,
  readAiLimitsConfig,
  budgetPercent,
} from "@/application/ai/ai-limits";
import { getAiJobMonthlyStats } from "@/infrastructure/persistence/repositories/ai-jobs";
import { getUsageCount, monthKey } from "@/infrastructure/persistence/repositories/ai-usage";

export type AiUsageSummary = {
  monthKey: string;
  generationCount: number;
  succeeded: number;
  failed: number;
  inProgress: number;
  estimatedCostUsd: number;
  budgetEur: number;
  spentEur: number;
  budgetPercent: number;
  monthlyGenCapPendingBenchmark: true;
};

export async function getAiUsageSummary(
  client: SupabaseClient,
  salonId: string,
): Promise<AiUsageSummary> {
  const config = readAiLimitsConfig();
  const key = monthKey();
  const [stats, counterCount, spentEur] = await Promise.all([
    getAiJobMonthlyStats(client, salonId, key),
    getUsageCount(client, salonId, "month", key),
    getMonthlySpendEur(client, salonId, config),
  ]);

  return {
    monthKey: key,
    generationCount: Math.max(counterCount, stats.total),
    succeeded: stats.succeeded,
    failed: stats.failed,
    inProgress: stats.inProgress,
    estimatedCostUsd: stats.estimatedCostUsd,
    budgetEur: config.budgetEur,
    spentEur,
    budgetPercent: budgetPercent(spentEur, config.budgetEur),
    monthlyGenCapPendingBenchmark: true,
  };
}
