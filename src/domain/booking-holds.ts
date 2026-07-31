import { addHours, addMinutes } from "date-fns";

export function holdHours(kind: "review" | "confirm"): number {
  if (kind === "review") {
    return Number(process.env.BOOKING_HOLD_REVIEW_HOURS ?? 24);
  }
  return Number(process.env.BOOKING_HOLD_CONFIRM_HOURS ?? 12);
}

export function addHold(from: Date, kind: "review" | "confirm"): Date {
  return addHours(from, holdHours(kind));
}

export function endsFromStart(start: Date, minutes: number): Date {
  return addMinutes(start, minutes);
}
