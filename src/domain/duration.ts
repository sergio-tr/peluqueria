export type Complexity = "low" | "medium" | "high";

const COMPLEXITY_MINUTES: Record<Complexity, number> = {
  low: 0,
  medium: 15,
  high: 30,
};

export function suggestedDurationMinutes(input: {
  baseMinutes: number;
  complexity: Complexity;
  /** Prefer explicit extra_minutes from hairstyle when present */
  extraMinutes?: number;
  marginMinutes?: number;
}): number {
  const complexityExtra =
    input.extraMinutes ?? COMPLEXITY_MINUTES[input.complexity];
  const margin = input.marginMinutes ?? 0;
  return input.baseMinutes + complexityExtra + margin;
}
