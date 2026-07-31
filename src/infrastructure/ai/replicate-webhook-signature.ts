import { createHmac, timingSafeEqual } from "node:crypto";

export const WEBHOOK_MAX_SKEW_MS = 5 * 60 * 1000;

export function verifyReplicateWebhookSignature(
  rawBody: string,
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null,
  secret: string,
  nowMs: number = Date.now(),
): boolean {
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const ts = Number(webhookTimestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }

  const skewMs = Math.abs(nowMs - ts * 1000);
  if (skewMs > WEBHOOK_MAX_SKEW_MS) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret.replace(/^whsec_/, ""))
    .update(signedContent)
    .digest("base64");

  const signatures = webhookSignature.split(" ").map((part) => {
    const [, value] = part.split(",");
    return value;
  });

  return signatures.some((sig) => {
    if (!sig) return false;
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}
