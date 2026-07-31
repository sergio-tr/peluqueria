import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getISODay, parseISO } from "date-fns";

export const SALON_TZ = "Europe/Madrid";

export type AvailabilityRule = {
  weekday: number; // ISO 1-7
  startLocal: string; // HH:mm
  endLocal: string;
};

export type BusyInterval = {
  startsAt: Date;
  endsAt: Date;
};

function parseLocalTime(dateYmd: string, hhmm: string, timeZone: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return fromZonedTime(
    `${dateYmd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
    timeZone,
  );
}

export function listSlotsForDay(input: {
  dateYmd: string;
  rules: AvailabilityRule[];
  busy: BusyInterval[];
  durationMinutes: number;
  slotMinutes?: number;
  timeZone?: string;
  now?: Date;
}): Date[] {
  const timeZone = input.timeZone ?? SALON_TZ;
  const slotMinutes = input.slotMinutes ?? 15;
  const now = input.now ?? new Date();
  const weekday = getISODay(parseISO(`${input.dateYmd}T12:00:00`));
  const dayRules = input.rules.filter((r) => r.weekday === weekday);
  const slots: Date[] = [];

  for (const rule of dayRules) {
    let cursor = parseLocalTime(input.dateYmd, rule.startLocal, timeZone);
    const end = parseLocalTime(input.dateYmd, rule.endLocal, timeZone);
    while (addMinutes(cursor, input.durationMinutes) <= end) {
      const slotEnd = addMinutes(cursor, input.durationMinutes);
      const overlaps = input.busy.some(
        (b) => cursor < b.endsAt && slotEnd > b.startsAt,
      );
      if (!overlaps && cursor > now) {
        slots.push(cursor);
      }
      cursor = addMinutes(cursor, slotMinutes);
    }
  }
  return slots;
}

export function formatSalonLocal(
  date: Date,
  pattern = "yyyy-MM-dd HH:mm",
): string {
  return formatInTimeZone(date, SALON_TZ, pattern);
}
