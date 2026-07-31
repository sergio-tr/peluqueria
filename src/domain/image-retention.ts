import { addDays, addHours } from "date-fns";

export type RetentionTier = "draft" | "unconfirmed" | "confirmed";

export type RetentionWindows = {
  draftHours: number;
  unconfirmedDays: number;
  confirmedDaysAfterAppointment: number;
};

export function readRetentionWindows(
  env: NodeJS.ProcessEnv = process.env,
): RetentionWindows {
  return {
    draftHours: Number(env.RETENTION_DRAFT_HOURS ?? 24),
    unconfirmedDays: Number(env.RETENTION_UNCONFIRMED_DAYS ?? 7),
    confirmedDaysAfterAppointment: Number(
      env.RETENTION_CONFIRMED_DAYS_AFTER_APPOINTMENT ?? 30,
    ),
  };
}

export function draftCutoff(now: Date, windows: RetentionWindows): Date {
  return addHours(now, -windows.draftHours);
}

export function unconfirmedCutoff(now: Date, windows: RetentionWindows): Date {
  return addDays(now, -windows.unconfirmedDays);
}

export function confirmedPurgeCutoff(
  now: Date,
  windows: RetentionWindows,
): Date {
  return addDays(now, -windows.confirmedDaysAfterAppointment);
}

/** Appointment anchor for confirmed retention (C-07: 30d after appointment). */
export function appointmentAnchor(row: {
  proposed_ends_at: string | null;
  requested_ends_at: string | null;
  proposed_starts_at: string | null;
  requested_starts_at: string | null;
}): Date | null {
  const raw =
    row.proposed_ends_at ??
    row.requested_ends_at ??
    row.proposed_starts_at ??
    row.requested_starts_at;
  return raw ? new Date(raw) : null;
}

export function isConfirmedEligibleForPurge(
  row: {
    status: string;
    proposed_ends_at: string | null;
    requested_ends_at: string | null;
    proposed_starts_at: string | null;
    requested_starts_at: string | null;
  },
  now: Date,
  windows: RetentionWindows = readRetentionWindows(),
): boolean {
  if (row.status !== "CONFIRMED") return false;
  const anchor = appointmentAnchor(row);
  if (!anchor) return false;
  const cutoff = confirmedPurgeCutoff(now, windows);
  return anchor <= cutoff;
}

export function isUnconfirmedEligibleForPurge(
  row: { status: string; created_at: string },
  now: Date,
  windows: RetentionWindows = readRetentionWindows(),
): boolean {
  if (row.status === "CONFIRMED") return false;
  const cutoff = unconfirmedCutoff(now, windows);
  return new Date(row.created_at) <= cutoff;
}

export function isDraftPhotoEligibleForPurge(
  row: { created_at: string },
  now: Date,
  windows: RetentionWindows = readRetentionWindows(),
): boolean {
  const cutoff = draftCutoff(now, windows);
  return new Date(row.created_at) <= cutoff;
}
