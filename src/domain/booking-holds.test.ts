import { addHours } from "date-fns";
import { afterEach, describe, expect, it } from "vitest";
import { addHold, holdHours } from "./booking-holds";

describe("booking holds (D-07)", () => {
  afterEach(() => {
    delete process.env.BOOKING_HOLD_REVIEW_HOURS;
    delete process.env.BOOKING_HOLD_CONFIRM_HOURS;
  });

  it("defaults barber review hold to 24 hours", () => {
    expect(holdHours("review")).toBe(24);
    const from = new Date("2026-08-01T10:00:00.000Z");
    expect(addHold(from, "review")).toEqual(addHours(from, 24));
  });

  it("defaults customer confirmation hold to 12 hours", () => {
    expect(holdHours("confirm")).toBe(12);
    const from = new Date("2026-08-01T10:00:00.000Z");
    expect(addHold(from, "confirm")).toEqual(addHours(from, 12));
  });
});
