import { describe, expect, it } from "vitest";
import {
  appointmentAnchor,
  isConfirmedEligibleForPurge,
  isDraftPhotoEligibleForPurge,
  isUnconfirmedEligibleForPurge,
} from "@/domain/image-retention";

describe("image-retention", () => {
  const windows = {
    draftHours: 24,
    unconfirmedDays: 7,
    confirmedDaysAfterAppointment: 30,
  };

  it("uses 30 days after appointment for confirmed purge (C-07)", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    const appointment = new Date("2026-07-31T10:00:00.000Z");

    expect(
      isConfirmedEligibleForPurge(
        {
          status: "CONFIRMED",
          proposed_ends_at: appointment.toISOString(),
          requested_ends_at: null,
          proposed_starts_at: null,
          requested_starts_at: null,
        },
        now,
        windows,
      ),
    ).toBe(true);

    expect(
      isConfirmedEligibleForPurge(
        {
          status: "CONFIRMED",
          proposed_ends_at: new Date("2026-08-05T10:00:00.000Z").toISOString(),
          requested_ends_at: null,
          proposed_starts_at: null,
          requested_starts_at: null,
        },
        now,
        windows,
      ),
    ).toBe(false);
  });

  it("does not purge confirmed before 30d post-appointment", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    expect(
      isConfirmedEligibleForPurge(
        {
          status: "CONFIRMED",
          proposed_ends_at: new Date("2026-08-01T10:00:00.000Z").toISOString(),
          requested_ends_at: null,
          proposed_starts_at: null,
          requested_starts_at: null,
        },
        now,
        windows,
      ),
    ).toBe(false);
  });

  it("purges unconfirmed requests after 7 days", () => {
    const now = new Date("2026-08-10T00:00:00.000Z");
    expect(
      isUnconfirmedEligibleForPurge(
        {
          status: "PENDING_BARBER_REVIEW",
          created_at: new Date("2026-08-01T00:00:00.000Z").toISOString(),
        },
        now,
        windows,
      ),
    ).toBe(true);
    expect(
      isUnconfirmedEligibleForPurge(
        {
          status: "PENDING_CUSTOMER_CONFIRMATION",
          created_at: new Date("2026-08-05T00:00:00.000Z").toISOString(),
        },
        now,
        windows,
      ),
    ).toBe(false);
  });

  it("never treats confirmed as unconfirmed tier", () => {
    const now = new Date("2026-12-01T00:00:00.000Z");
    expect(
      isUnconfirmedEligibleForPurge(
        {
          status: "CONFIRMED",
          created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        },
        now,
        windows,
      ),
    ).toBe(false);
  });

  it("purges draft photos after 24 hours", () => {
    const now = new Date("2026-08-02T01:00:00.000Z");
    expect(
      isDraftPhotoEligibleForPurge(
        { created_at: new Date("2026-08-01T00:00:00.000Z").toISOString() },
        now,
        windows,
      ),
    ).toBe(true);
    expect(
      isDraftPhotoEligibleForPurge(
        { created_at: new Date("2026-08-01T12:30:00.000Z").toISOString() },
        now,
        windows,
      ),
    ).toBe(false);
  });

  it("prefers proposed_ends_at as appointment anchor", () => {
    const anchor = appointmentAnchor({
      proposed_ends_at: "2026-08-01T11:00:00.000Z",
      requested_ends_at: "2026-08-01T09:00:00.000Z",
      proposed_starts_at: "2026-08-01T10:00:00.000Z",
      requested_starts_at: "2026-08-01T08:00:00.000Z",
    });
    expect(anchor?.toISOString()).toBe("2026-08-01T11:00:00.000Z");
  });
});
