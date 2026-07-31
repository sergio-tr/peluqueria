import { BLOCKING_STATUSES, type BookingStatus } from "@/domain/booking-state";

export function statusBlocksSlot(status: BookingStatus): boolean {
  return BLOCKING_STATUSES.includes(status);
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function effectiveSlotRange(booking: {
  proposedStartsAt?: Date;
  proposedEndsAt?: Date;
  requestedStartsAt: Date;
  requestedEndsAt: Date;
}): { startsAt: Date; endsAt: Date } {
  return {
    startsAt: booking.proposedStartsAt ?? booking.requestedStartsAt,
    endsAt: booking.proposedEndsAt ?? booking.requestedEndsAt,
  };
}
