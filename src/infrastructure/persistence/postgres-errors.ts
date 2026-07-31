import { AppError } from "@/domain/errors";

type PostgresErrorLike = {
  code?: string;
  message?: string;
  details?: string;
};

export function isPostgresError(error: unknown): error is PostgresErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "message" in error)
  );
}

/** Exclusion (23P01) or unique (23505) violations from slot constraints. */
export function isSlotConflictError(error: unknown): boolean {
  if (!isPostgresError(error)) return false;
  return error.code === "23P01" || error.code === "23505";
}

export function mapPostgresBookingError(error: unknown): AppError | null {
  if (!isPostgresError(error)) return null;

  if (isSlotConflictError(error)) {
    return new AppError(
      "SLOT_UNAVAILABLE",
      "Ese horario ya no está disponible.",
      409,
    );
  }

  if (error.code === "P0002" || error.message?.includes("BOOKING_NOT_FOUND")) {
    return new AppError("NOT_FOUND", "Solicitud no encontrada.", 404);
  }

  if (error.code === "P0001" || error.message?.includes("INVALID_STATE")) {
    return new AppError(
      "INVALID_STATE",
      "La solicitud ya no está en un estado válido para esta acción.",
      409,
    );
  }

  return null;
}

export function rethrowMappedPostgresError(error: unknown): never {
  throw mapPostgresBookingError(error) ?? error;
}
