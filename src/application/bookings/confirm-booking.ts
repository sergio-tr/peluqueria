import type { SupabaseClient } from "@supabase/supabase-js";
import { assertTransition } from "@/domain/booking-state";
import { AppError } from "@/domain/errors";
import { appendBookingEvent } from "@/infrastructure/persistence/repositories/booking-events";
import {
  getBookingById,
  hasOverlappingBooking,
  updateBooking,
} from "@/infrastructure/persistence/repositories/bookings";
import {
  findTokenByPlaintext,
  markTokenUsed,
} from "@/infrastructure/persistence/repositories/confirmation-tokens";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function confirmBookingAction(
  client: SupabaseClient,
  token: string,
  action: "confirm" | "decline",
) {
  const record = await findTokenByPlaintext(client, token);
  if (!record) {
    throw new AppError("TOKEN_INVALID", "Enlace no válido.", 404);
  }

  const booking = await getBookingById(client, SALON_ID, record.bookingRequestId);
  if (!booking) {
    throw new AppError("NOT_FOUND", "Cita no encontrada.", 404);
  }

  if (record.usedAt) {
    return { status: booking.status, idempotent: true as const };
  }
  if (record.expiresAt < new Date()) {
    throw new AppError("TOKEN_EXPIRED", "Este enlace ya no es válido.", 410);
  }

  const now = new Date();

  if (action === "confirm") {
    assertTransition(booking.status, "CONFIRMED", "client");
    const start = booking.proposedStartsAt ?? booking.requestedStartsAt;
    const end = booking.proposedEndsAt ?? booking.requestedEndsAt;
    if (
      await hasOverlappingBooking(
        client,
        booking.staffId,
        start,
        end,
        booking.id,
      )
    ) {
      throw new AppError(
        "SLOT_UNAVAILABLE",
        "El horario ya no está disponible.",
        409,
      );
    }
    const updated = await updateBooking(client, SALON_ID, booking.id, {
      status: "CONFIRMED",
      proposedStartsAt: start,
      proposedEndsAt: end,
    });
    await markTokenUsed(client, record.id, now);
    await appendBookingEvent(client, {
      salonId: SALON_ID,
      bookingRequestId: booking.id,
      fromStatus: booking.status,
      toStatus: "CONFIRMED",
      actorType: "client",
    });
    return { status: updated.status };
  }

  assertTransition(booking.status, "DECLINED", "client");
  const updated = await updateBooking(client, SALON_ID, booking.id, {
    status: "DECLINED",
  });
  await markTokenUsed(client, record.id, now);
  await appendBookingEvent(client, {
    salonId: SALON_ID,
    bookingRequestId: booking.id,
    fromStatus: booking.status,
    toStatus: "DECLINED",
    actorType: "client",
  });
  return { status: updated.status };
}

export async function getConfirmationPreview(
  client: SupabaseClient,
  token: string,
) {
  const record = await findTokenByPlaintext(client, token);
  if (!record) {
    throw new AppError("TOKEN_INVALID", "Enlace no válido.", 404);
  }
  if (record.usedAt || record.expiresAt < new Date()) {
    throw new AppError("TOKEN_EXPIRED", "Este enlace ya no es válido.", 410);
  }

  const booking = await getBookingById(client, SALON_ID, record.bookingRequestId);
  if (!booking) {
    throw new AppError("NOT_FOUND", "Cita no encontrada.", 404);
  }

  return booking;
}
