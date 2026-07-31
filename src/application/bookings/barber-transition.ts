import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertTransition } from "@/domain/booking-state";
import { addHold, endsFromStart } from "@/domain/booking-holds";
import { AppError } from "@/domain/errors";
import { transitionBookingWithEvent } from "@/infrastructure/persistence/repositories/booking-transactions";
import { getBookingById } from "@/infrastructure/persistence/repositories/bookings";
import {
  hashConfirmationToken,
  insertConfirmationToken,
  invalidateTokensForBooking,
} from "@/infrastructure/persistence/repositories/confirmation-tokens";
import { insertDemoInboxMessage } from "@/infrastructure/persistence/repositories/demo-inbox";
import { SALON_ID } from "@/infrastructure/supabase/client";

export type BarberTransitionInput = {
  bookingId: string;
  action: "approve" | "propose" | "reject";
  proposedStartsAt?: string;
  durationMinutes?: number;
  comment?: string;
};

export async function applyBarberTransition(
  client: SupabaseClient,
  input: BarberTransitionInput,
) {
  const booking = await getBookingById(client, SALON_ID, input.bookingId);
  if (!booking) {
    throw new AppError("NOT_FOUND", "Solicitud no encontrada.", 404);
  }

  const now = new Date();

  if (input.action === "reject") {
    assertTransition(booking.status, "REJECTED", "barber");
    const updated = await transitionBookingWithEvent(client, {
      salonId: SALON_ID,
      bookingId: booking.id,
      expectedFromStatus: booking.status,
      toStatus: "REJECTED",
      actorType: "barber",
      barberComment: input.comment,
    });
    await invalidateTokensForBooking(client, booking.id);
    return { status: updated.status };
  }

  assertTransition(
    booking.status,
    "PENDING_CUSTOMER_CONFIRMATION",
    "barber",
  );

  const duration =
    input.durationMinutes ??
    booking.finalDurationMinutes ??
    booking.suggestedDurationMinutes;
  const start = input.proposedStartsAt
    ? new Date(input.proposedStartsAt)
    : (booking.proposedStartsAt ?? booking.requestedStartsAt);
  const end = endsFromStart(start, duration);

  await invalidateTokensForBooking(client, booking.id);

  const plaintext = randomBytes(32).toString("base64url");
  const tokenHash = hashConfirmationToken(plaintext);
  const tokenId = crypto.randomUUID();

  await insertConfirmationToken(client, {
    id: tokenId,
    bookingRequestId: booking.id,
    tokenHash,
    expiresAt: addHold(now, "confirm"),
  });

  const updated = await transitionBookingWithEvent(client, {
    salonId: SALON_ID,
    bookingId: booking.id,
    expectedFromStatus: booking.status,
    toStatus: "PENDING_CUSTOMER_CONFIRMATION",
    actorType: "barber",
    proposedStartsAt: start,
    proposedEndsAt: end,
    finalDurationMinutes: duration,
    holdExpiresAt: addHold(now, "confirm"),
    barberComment: input.comment,
    payload: { durationMinutes: duration },
  });

  const confirmPath = `/confirm/${plaintext}`;

  await insertDemoInboxMessage(client, {
    id: crypto.randomUUID(),
    salonId: SALON_ID,
    bookingRequestId: booking.id,
    subject: "Confirma tu cita en Peluquería Nowi",
    bodySummary: `Propuesta lista. Duración ${duration} min.`,
    confirmPath,
  });

  return {
    status: updated.status,
    confirmPath,
  };
}
