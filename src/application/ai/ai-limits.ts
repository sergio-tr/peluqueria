import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import {
  bumpUsage,
  dayKey,
  getUsageCount,
  monthKey,
} from "@/infrastructure/persistence/repositories/ai-usage";
import { hasActiveJobForSession } from "@/infrastructure/persistence/repositories/ai-jobs";

export type BudgetAlertThreshold = 70 | 90 | 100;

export type BudgetAlertEvent = {
  threshold: BudgetAlertThreshold;
  spentEur: number;
  budgetEur: number;
};

export const budgetAlertHooks: Array<(event: BudgetAlertEvent) => void> = [];

export type AiLimitsConfig = {
  maxSession: number;
  maxIpDay: number;
  maxConcurrent: number;
  budgetEur: number;
  costPerOutputUsd: number;
  eurUsdRate: number;
};

export function readAiLimitsConfig(): AiLimitsConfig {
  return {
    maxSession: Number(process.env.AI_MAX_GENERATIONS_PER_SESSION || 3),
    maxIpDay: Number(process.env.AI_MAX_GENERATIONS_PER_IP_DAY || 10),
    maxConcurrent: Number(process.env.AI_MAX_CONCURRENT_PER_SESSION || 1),
    budgetEur: Number(process.env.AI_MONTHLY_BUDGET_EUR || 30),
    costPerOutputUsd: Number(
      process.env.AI_ESTIMATED_COST_PER_OUTPUT_USD || 0.03,
    ),
    eurUsdRate: Number(process.env.AI_EUR_USD_RATE || 1.08),
  };
}

export function costPerOutputEur(config: AiLimitsConfig): number {
  return config.costPerOutputUsd / config.eurUsdRate;
}

export async function getMonthlySpendEur(
  client: SupabaseClient,
  salonId: string,
  config: AiLimitsConfig = readAiLimitsConfig(),
): Promise<number> {
  const count = await getUsageCount(
    client,
    salonId,
    "month",
    monthKey(),
  );
  return count * costPerOutputEur(config);
}

export function budgetPercent(spentEur: number, budgetEur: number): number {
  if (budgetEur <= 0) return 100;
  return (spentEur / budgetEur) * 100;
}

export function crossedBudgetThreshold(
  previousPercent: number,
  currentPercent: number,
): BudgetAlertThreshold | null {
  const thresholds: BudgetAlertThreshold[] = [70, 90, 100];
  for (const threshold of thresholds) {
    if (previousPercent < threshold && currentPercent >= threshold) {
      return threshold;
    }
  }
  return null;
}

export function emitBudgetAlert(event: BudgetAlertEvent): void {
  for (const hook of budgetAlertHooks) {
    hook(event);
  }
  console.info(
    `[ai-budget-alert] threshold=${event.threshold} spentEur=${event.spentEur.toFixed(4)} budgetEur=${event.budgetEur}`,
  );
}

export async function maybeEmitBudgetAlert(
  client: SupabaseClient,
  salonId: string,
  config: AiLimitsConfig = readAiLimitsConfig(),
): Promise<void> {
  const count = await getUsageCount(
    client,
    salonId,
    "month",
    monthKey(),
  );
  const spentEur = count * costPerOutputEur(config);
  const previousSpentEur = Math.max(0, (count - 1) * costPerOutputEur(config));
  const threshold = crossedBudgetThreshold(
    budgetPercent(previousSpentEur, config.budgetEur),
    budgetPercent(spentEur, config.budgetEur),
  );
  if (threshold) {
    emitBudgetAlert({
      threshold,
      spentEur,
      budgetEur: config.budgetEur,
    });
  }
}

export function assertGenerationEnabled(): void {
  if (process.env.AI_GENERATION_ENABLED === "false") {
    throw new AppError(
      "AI_DISABLED",
      "La generación está temporalmente desactivada.",
      503,
    );
  }
}

export type EnforceAiLimitsInput = {
  sessionId: string;
  ipHash: string;
  /** When retrying, skip bumping counters (already counted on original attempt). */
  skipUsageBump?: boolean;
};

export async function enforceAiLimits(
  client: SupabaseClient,
  salonId: string,
  input: EnforceAiLimitsInput,
  config: AiLimitsConfig = readAiLimitsConfig(),
): Promise<void> {
  assertGenerationEnabled();

  const monthlyCount = await getUsageCount(
    client,
    salonId,
    "month",
    monthKey(),
  );
  const nextSpendEur = (monthlyCount + (input.skipUsageBump ? 0 : 1)) * costPerOutputEur(config);
  if (nextSpendEur > config.budgetEur) {
    throw new AppError(
      "BUDGET_EXCEEDED",
      "Se ha alcanzado el presupuesto mensual de generaciones.",
      429,
    );
  }

  if (!input.skipUsageBump) {
    if (
      !(await bumpUsage(
        client,
        salonId,
        "session",
        input.sessionId,
        config.maxSession,
        undefined,
        input.sessionId,
      ))
    ) {
      throw new AppError(
        "SESSION_LIMIT",
        "Has alcanzado el máximo de generaciones de esta sesión.",
        429,
      );
    }
    if (
      !(await bumpUsage(
        client,
        salonId,
        "day",
        `${dayKey()}:${input.ipHash}`,
        config.maxIpDay,
        input.ipHash,
      ))
    ) {
      throw new AppError(
        "IP_DAY_LIMIT",
        "Se ha alcanzado el límite diario de generaciones.",
        429,
      );
    }
    if (
      !(await bumpUsage(client, salonId, "month", monthKey(), Number.MAX_SAFE_INTEGER))
    ) {
      throw new AppError(
        "BUDGET_EXCEEDED",
        "Se ha alcanzado el presupuesto mensual de generaciones.",
        429,
      );
    }
    await maybeEmitBudgetAlert(client, salonId, config);
  } else {
    const sessionCount = await getUsageCount(
      client,
      salonId,
      "session",
      input.sessionId,
      undefined,
      input.sessionId,
    );
    if (sessionCount >= config.maxSession) {
      throw new AppError(
        "SESSION_LIMIT",
        "Has alcanzado el máximo de generaciones de esta sesión.",
        429,
      );
    }
    const dayCount = await getUsageCount(
      client,
      salonId,
      "day",
      `${dayKey()}:${input.ipHash}`,
      input.ipHash,
    );
    if (dayCount >= config.maxIpDay) {
      throw new AppError(
        "IP_DAY_LIMIT",
        "Se ha alcanzado el límite diario de generaciones.",
        429,
      );
    }
  }

  if (config.maxConcurrent > 0 && (await hasActiveJobForSession(client, salonId, input.sessionId))) {
    throw new AppError(
      "CONCURRENT_LIMIT",
      "Ya hay una generación en curso en esta sesión.",
      429,
    );
  }
}
