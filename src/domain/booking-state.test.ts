import { describe, expect, it } from "vitest";
import { canTransition, assertTransition, BLOCKING_STATUSES } from "./booking-state";

describe("booking-state", () => {
  it("defines D-07 blocking statuses", () => {
    expect(BLOCKING_STATUSES).toEqual([
      "PENDING_BARBER_REVIEW",
      "PENDING_CUSTOMER_CONFIRMATION",
      "CONFIRMED",
    ]);
  });

  it("allows barber propose", () => {
    expect(
      canTransition(
        "PENDING_BARBER_REVIEW",
        "PENDING_CUSTOMER_CONFIRMATION",
        "barber",
      ),
    ).toBe(true);
  });

  it("rejects client confirm from review", () => {
    expect(
      canTransition("PENDING_BARBER_REVIEW", "CONFIRMED", "client"),
    ).toBe(false);
  });

  it("throws on invalid assert", () => {
    expect(() =>
      assertTransition("DRAFT", "CONFIRMED", "client"),
    ).toThrow(/Invalid transition/);
  });
});
