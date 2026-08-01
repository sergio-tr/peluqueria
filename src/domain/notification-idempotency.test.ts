import { describe, expect, it } from "vitest";
import { bookingConfirmedNotificationKey } from "./notification-idempotency";

describe("notification idempotency keys", () => {
  it("builds booking-confirmed key per D-08", () => {
    expect(bookingConfirmedNotificationKey("abc-123")).toBe(
      "booking-confirmed:abc-123",
    );
  });
});
