import { describe, expect, it, beforeEach } from "vitest";
import { DemoAccessRateLimiter } from "./demo-rate-limit";

describe("DemoAccessRateLimiter", () => {
  let now: number;
  const config = { maxAttempts: 3, windowMs: 60_000 };

  beforeEach(() => {
    now = 1_000_000;
  });

  it("allows attempts under the limit", () => {
    const limiter = new DemoAccessRateLimiter(config, () => now);
    expect(limiter.check("ip-a").allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(true);
  });

  it("blocks when max attempts exceeded within window", () => {
    const limiter = new DemoAccessRateLimiter(config, () => now);
    limiter.check("ip-a");
    limiter.check("ip-a");
    limiter.check("ip-a");
    const blocked = limiter.check("ip-a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const limiter = new DemoAccessRateLimiter(config, () => now);
    limiter.check("ip-a");
    limiter.check("ip-a");
    limiter.check("ip-a");
    expect(limiter.check("ip-a").allowed).toBe(false);

    now += config.windowMs + 1;
    expect(limiter.check("ip-a").allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const limiter = new DemoAccessRateLimiter(config, () => now);
    limiter.check("ip-a");
    limiter.check("ip-a");
    limiter.check("ip-a");
    expect(limiter.check("ip-a").allowed).toBe(false);
    expect(limiter.check("ip-b").allowed).toBe(true);
  });
});
