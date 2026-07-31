import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  verifyReplicateWebhookSignature,
  WEBHOOK_MAX_SKEW_MS,
} from "./replicate-webhook-signature";

const SECRET = "whsec_test_secret";
const NOW = 1_700_000_000_000;

function sign(
  webhookId: string,
  timestampSec: number,
  rawBody: string,
  secret = SECRET,
): string {
  const signedContent = `${webhookId}.${timestampSec}.${rawBody}`;
  const digest = createHmac("sha256", secret.replace(/^whsec_/, ""))
    .update(signedContent)
    .digest("base64");
  return `v1,${digest}`;
}

describe("verifyReplicateWebhookSignature", () => {
  const webhookId = "msg_123";
  const rawBody = JSON.stringify({ id: "pred_1", status: "succeeded" });
  const timestampSec = Math.floor(NOW / 1000);

  it("accepts a valid signature within skew window", () => {
    expect(
      verifyReplicateWebhookSignature(
        rawBody,
        webhookId,
        String(timestampSec),
        sign(webhookId, timestampSec, rawBody),
        SECRET,
        NOW,
      ),
    ).toBe(true);
  });

  it("rejects missing headers", () => {
    expect(
      verifyReplicateWebhookSignature(rawBody, null, "1", "v1,x", SECRET, NOW),
    ).toBe(false);
  });

  it("rejects timestamp outside skew window", () => {
    const staleSec = Math.floor((NOW - WEBHOOK_MAX_SKEW_MS - 1000) / 1000);
    expect(
      verifyReplicateWebhookSignature(
        rawBody,
        webhookId,
        String(staleSec),
        sign(webhookId, staleSec, rawBody),
        SECRET,
        NOW,
      ),
    ).toBe(false);
  });

  it("rejects tampered body", () => {
    expect(
      verifyReplicateWebhookSignature(
        rawBody,
        webhookId,
        String(timestampSec),
        sign(webhookId, timestampSec, '{"id":"other"}'),
        SECRET,
        NOW,
      ),
    ).toBe(false);
  });

  it("rejects wrong secret", () => {
    expect(
      verifyReplicateWebhookSignature(
        rawBody,
        webhookId,
        String(timestampSec),
        sign(webhookId, timestampSec, rawBody, "whsec_other"),
        SECRET,
        NOW,
      ),
    ).toBe(false);
  });
});
