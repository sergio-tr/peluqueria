import { SignJWT, jwtVerify } from "jose";

export const demoSession = {
  cookieName: "nowi_demo_session",
  maxAgeSeconds: 60 * 60 * 24 * 7,
} as const;

function getSecretKey(): Uint8Array {
  const secret = process.env.DEMO_SESSION_SECRET;
  if (!secret) {
    throw new Error("DEMO_SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function createDemoSessionToken(): Promise<string> {
  return new SignJWT({ v: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${demoSession.maxAgeSeconds}s`)
    .sign(getSecretKey());
}

export async function verifyDemoSessionToken(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  try {
    await jwtVerify(value, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export function demoAccessCodeValid(code: string): boolean {
  const expected = process.env.DEMO_ACCESS_CODE;
  if (!expected) return false;
  if (code.trim().length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= code.trim().charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
