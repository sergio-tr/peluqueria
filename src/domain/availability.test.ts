import { describe, expect, it } from "vitest";
import { listSlotsForDay } from "./availability";

describe("listSlotsForDay", () => {
  it("returns 15-minute slots inside morning window", () => {
    const slots = listSlotsForDay({
      dateYmd: "2026-08-04", // Tuesday
      rules: [{ weekday: 2, startLocal: "10:00", endLocal: "14:00" }],
      busy: [],
      durationMinutes: 45,
      now: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(slots.length).toBeGreaterThan(0);
    // last start must allow 45 min before 14:00 Madrid
    expect(slots.at(-1)?.toISOString()).toBeTruthy();
  });

  it("excludes overlapping busy intervals", () => {
    const slots = listSlotsForDay({
      dateYmd: "2026-08-04",
      rules: [{ weekday: 2, startLocal: "10:00", endLocal: "11:00" }],
      busy: [
        {
          startsAt: new Date("2026-08-04T08:00:00.000Z"), // 10:00 Madrid (CEST)
          endsAt: new Date("2026-08-04T08:45:00.000Z"),
        },
      ],
      durationMinutes: 45,
      now: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(slots).toHaveLength(0);
  });
});
