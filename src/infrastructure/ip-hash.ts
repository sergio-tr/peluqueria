import { createHmac } from "node:crypto";

function resolveIpHashSecret(): string {
  const secret = process.env.IP_HASH_SECRET;
  if (secret) return secret;
  const isProduction =
    process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProduction) {
    throw new Error("IP_HASH_SECRET is not configured");
  }
  return "dev-ip-hash-secret";
}

export function hashIp(ip: string): string {
  const secret = resolveIpHashSecret();
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }
  return request.headers.get("x-real-ip") ?? "0.0.0.0";
}