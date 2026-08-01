import { describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import {
  isSlotConflictError,
  mapPostgresBookingError,
  rethrowMappedPostgresError,
} from "@/infrastructure/persistence/postgres-errors";

describe("postgres-errors", () => {
  it("maps exclusion violation to SLOT_UNAVAILABLE 409", () => {
    const mapped = mapPostgresBookingError({
      code: "23P01",
      message: "conflicting key value violates exclusion constraint",
    });
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped?.code).toBe("SLOT_UNAVAILABLE");
    expect(mapped?.status).toBe(409);
  });

  it("maps unique violation to SLOT_UNAVAILABLE 409", () => {
    const mapped = mapPostgresBookingError({ code: "23505" });
    expect(mapped?.code).toBe("SLOT_UNAVAILABLE");
    expect(mapped?.status).toBe(409);
  });

  it("maps invalid state to 409", () => {
    const mapped = mapPostgresBookingError({
      code: "P0001",
      message: "INVALID_STATE",
    });
    expect(mapped?.code).toBe("INVALID_STATE");
    expect(mapped?.status).toBe(409);
  });

  it("rethrows mapped slot conflict", () => {
    expect(() =>
      rethrowMappedPostgresError({ code: "23P01", message: "overlap" }),
    ).toThrow(AppError);
    expect(isSlotConflictError({ code: "23P01" })).toBe(true);
  });

  it("rethrows unknown errors unchanged", () => {
    const raw = new Error("network");
    expect(() => rethrowMappedPostgresError(raw)).toThrow(raw);
  });
});
