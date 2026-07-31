import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createDemoSessionToken,
  verifyDemoSessionToken,
  demoAccessCodeValid,
} from "./demo-session";

describe("demo-session", () => {
  const prevSecret = process.env.DEMO_SESSION_SECRET;
  const prevCode = process.env.DEMO_ACCESS_CODE;

  beforeEach(() => {
    process.env.DEMO_SESSION_SECRET = "test-secret-at-least-32-chars-long!!";
    process.env.DEMO_ACCESS_CODE = "test-access-code-xyz";
  });

  afterEach(() => {
    process.env.DEMO_SESSION_SECRET = prevSecret;
    process.env.DEMO_ACCESS_CODE = prevCode;
  });

  it("creates and verifies a session token", async () => {
    const token = await createDemoSessionToken();
    expect(await verifyDemoSessionToken(token)).toBe(true);
  });

  it("rejects tampered tokens", async () => {
    const token = await createDemoSessionToken();
    expect(await verifyDemoSessionToken(`${token}x`)).toBe(false);
  });

  it("validates access code with constant-time compare", () => {
    expect(demoAccessCodeValid("test-access-code-xyz")).toBe(true);
    expect(demoAccessCodeValid("wrong")).toBe(false);
  });

  it("fails closed when DEMO_ACCESS_CODE is unset", () => {
    delete process.env.DEMO_ACCESS_CODE;
    expect(demoAccessCodeValid("anything")).toBe(false);
  });
});
