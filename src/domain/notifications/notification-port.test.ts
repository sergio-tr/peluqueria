import { describe, expect, it } from "vitest";
import {
  buildBookingConfirmedBodySummary,
  buildProposalBodySummary,
} from "./notification-port";

describe("notification port helpers", () => {
  it("builds proposal body with duration", () => {
    expect(buildProposalBodySummary(45)).toBe(
      "Propuesta lista. Duración 45 min.",
    );
  });

  it("builds confirmed body in Europe/Madrid", () => {
    const body = buildBookingConfirmedBodySummary(
      new Date("2026-08-05T07:00:00.000Z"),
      60,
    );
    expect(body).toContain("Cita confirmada");
    expect(body).toContain("60 min");
  });
});
