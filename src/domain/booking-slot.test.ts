import { describe, expect, it } from "vitest";
import {
  rangesOverlap,
  statusBlocksSlot,
} from "@/domain/booking-slot";
import type { BookingStatus } from "@/domain/booking-state";

const ALL_STATUSES: BookingStatus[] = [
  "DRAFT",
  "AI_PROCESSING",
  "READY_TO_BOOK",
  "PENDING_BARBER_REVIEW",
  "PENDING_CUSTOMER_CONFIRMATION",
  "CONFIRMED",
  "DECLINED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
];

describe("booking-slot", () => {
  it("only D-07 blocking statuses occupy slots", () => {
    const blocking = ALL_STATUSES.filter(statusBlocksSlot);
    expect(blocking).toEqual([
      "PENDING_BARBER_REVIEW",
      "PENDING_CUSTOMER_CONFIRMATION",
      "CONFIRMED",
    ]);
  });

  it("detects overlapping ranges", () => {
    const start = new Date("2026-08-05T09:00:00.000Z");
    const end = new Date("2026-08-05T10:00:00.000Z");
    const overlapStart = new Date("2026-08-05T09:30:00.000Z");
    const overlapEnd = new Date("2026-08-05T10:30:00.000Z");
    const after = new Date("2026-08-05T10:00:00.000Z");
    const afterEnd = new Date("2026-08-05T11:00:00.000Z");

    expect(rangesOverlap(start, end, overlapStart, overlapEnd)).toBe(true);
    expect(rangesOverlap(start, end, after, afterEnd)).toBe(false);
  });
});
