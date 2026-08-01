const SIGNED_URL_PATTERN =
  /https?:\/\/[^\s"']+(?:token=|X-Amz-Signature=|sig=)[^\s"']*/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+?\d[\d\s().-]{7,}\d)\b/g;

export function redactSensitiveText(value: string): string {
  return value
    .replace(SIGNED_URL_PATTERN, "[redacted-url]")
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(PHONE_PATTERN, "[redacted-phone]");
}

export function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeLogValue);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (/url|email|phone|name|token/i.test(key) && !/count|total/i.test(key)) {
        out[key] = "[redacted]";
        continue;
      }
      if (/path$/i.test(key) || /imagepath$/i.test(key)) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = sanitizeLogValue(nested);
    }
    return out;
  }
  return value;
}

export type StructuredLogEvent = {
  event: string;
  [key: string]: unknown;
};

export function logStructured(event: StructuredLogEvent): void {
  const safe = sanitizeLogValue(event) as StructuredLogEvent;
  console.info(JSON.stringify(safe));
}
