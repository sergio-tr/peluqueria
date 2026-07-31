export type DemoRateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
};

/**
 * In-process sliding-window rate limiter for demo gate attempts.
 * Keyed by IP hash; suitable for single-instance preview. Document durable
 * store (Redis/PG) for multi-instance production in operator docs.
 */
export class DemoAccessRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly config: DemoRateLimitConfig,
    private readonly now: () => number = () => Date.now(),
  ) {}

  check(key: string): RateLimitResult {
    const now = this.now();
    const windowStart = now - this.config.windowMs;
    const timestamps = (this.attempts.get(key) ?? []).filter(
      (t) => t > windowStart,
    );

    if (timestamps.length >= this.config.maxAttempts) {
      const oldest = timestamps[0]!;
      return {
        allowed: false,
        retryAfterMs: Math.max(0, oldest + this.config.windowMs - now),
      };
    }

    timestamps.push(now);
    this.attempts.set(key, timestamps);
    return { allowed: true };
  }

  reset(key?: string): void {
    if (key) {
      this.attempts.delete(key);
      return;
    }
    this.attempts.clear();
  }
}

export function loadDemoRateLimitConfig(
  env: NodeJS.ProcessEnv = process.env,
): DemoRateLimitConfig {
  const maxAttempts = Number(env.DEMO_ACCESS_RATE_LIMIT_MAX ?? "10");
  const windowMs = Number(env.DEMO_ACCESS_RATE_LIMIT_WINDOW_MS ?? "900000");
  return {
    maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0 ? maxAttempts : 10,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 900_000,
  };
}

let sharedLimiter: DemoAccessRateLimiter | undefined;

export function getDemoAccessRateLimiter(): DemoAccessRateLimiter {
  if (!sharedLimiter) {
    sharedLimiter = new DemoAccessRateLimiter(loadDemoRateLimitConfig());
  }
  return sharedLimiter;
}

/** Test hook — replace the process-wide limiter instance. */
export function setDemoAccessRateLimiter(limiter: DemoAccessRateLimiter): void {
  sharedLimiter = limiter;
}
