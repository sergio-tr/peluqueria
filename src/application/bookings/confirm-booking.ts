import type { SupabaseClient } from "@supabase/supabase-js";
import { canTransition, type BookingStatus } from "@/domain/booking-state";
import { bookingConfirmedNotificationKey } from "@/domain/notification-idempotency";
import {
  BOOKING_CONFIRMED_INBOX_SUBJECT,
  buildBookingConfirmedBodySummary,
  type NotificationPort,
} from "@/domain/notifications/notification-port";
import { AppError } from "@/domain/errors";
import { createDemoInboxNotificationAdapter } from "@/infrastructure/notifications/demo-inbox-notification-adapter";
import { transitionBookingWithEvent } from "@/infrastructure/persistence/repositories/booking-transactions";
import { getBookingById, type BookingRequest } from "@/infrastructure/persistence/repositories/bookings";
import {
  findTokenByPlaintext,
  markTokenUsed,
  type ConfirmationToken,
} from "@/infrastructure/persistence/repositories/confirmation-tokens";
import {
  hasIdempotencyKey,
  recordIdempotencyKey,
} from "@/infrastructure/persistence/repositories/idempotency-keys";
import { SALON_ID } from "@/infrastructure/supabase/client";

export type ConfirmBookingResult = {
  status: BookingStatus;
  idempotent?: true;
};

export type ConfirmBookingDeps = {
  notifications?: NotificationPort;
};

function requireClientTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to, "client")) {
    throw new AppError(
      "INVALID_STATE",
      "La solicitud ya no está en un estado válido para esta acción.",
      409,
    );
  }
}

function tokenReplayResult(
  record: ConfirmationToken,
  booking: BookingRequest,
  action: "confirm" | "decline",
): ConfirmBookingResult | null {
  if (!record.usedAt) {
    return null;
  }
  if (action === "confirm" && booking.status === "CONFIRMED") {
    return { status: booking.status, idempotent: true };
  }
  if (action === "decline" && booking.status === "DECLINED") {
    return { status: booking.status, idempotent: true };
  }
  return null;
}

function isTokenExpiredUnused(record: ConfirmationToken, now: Date): boolean {
  return !record.usedAt && record.expiresAt < now;
}

/** Token marked used by invalidation (new propose) while booking still awaits confirm. */
function isTokenInvalidated(
  record: ConfirmationToken,
  booking: BookingRequest,
): boolean {
  return Boolean(record.usedAt) && booking.status === "PENDING_CUSTOMER_CONFIRMATION";
}

async function idempotentConfirmIfAlreadyDone(
  client: SupabaseClient,
  booking: BookingRequest,
): Promise<ConfirmBookingResult | null> {
  if (booking.status === "CONFIRMED") {
    return { status: booking.status, idempotent: true };
  }
  const key = bookingConfirmedNotificationKey(booking.id);
  if (await hasIdempotencyKey(client, key)) {
    const current = await getBookingById(client, SALON_ID, booking.id);
    if (current?.status === "CONFIRMED") {
      return { status: current.status, idempotent: true };
    }
  }
  return null;
}

export async function confirmBookingAction(
  client: SupabaseClient,
  token: string,
  action: "confirm" | "decline",
  deps: ConfirmBookingDeps = {},
): Promise<ConfirmBookingResult> {
  const notifications =
    deps.notifications ?? createDemoInboxNotificationAdapter(client);
  const record = await findTokenByPlaintext(client, token);
  if (!record) {
    throw new AppError("TOKEN_INVALID", "Enlace no válido.", 404);
  }

  const booking = await getBookingById(client, SALON_ID, record.bookingRequestId);
  if (!booking) {
    throw new AppError("NOT_FOUND", "Cita no encontrada.", 404);
  }

  const replay = tokenReplayResult(record, booking, action);
  if (replay) {
    return replay;
  }

  const now = new Date();

  if (isTokenExpiredUnused(record, now)) {
    throw new AppError("TOKEN_EXPIRED", "Este enlace ya no es válido.", 410);
  }

  if (isTokenInvalidated(record, booking)) {
    throw new AppError("TOKEN_EXPIRED", "Este enlace ya no es válido.", 410);
  }

  if (action === "confirm") {
    const alreadyDone = await idempotentConfirmIfAlreadyDone(client, booking);
    if (alreadyDone) {
      return alreadyDone;
    }

    requireClientTransition(booking.status, "CONFIRMED");

    const confirmKey = bookingConfirmedNotificationKey(booking.id);
    const keyResult = await recordIdempotencyKey(client, {
      key: confirmKey,
      salonId: SALON_ID,
      scope: "notification",
      resourceId: booking.id,
    });

    if (keyResult === "duplicate") {
      const current = await getBookingById(client, SALON_ID, booking.id);
      if (current?.status === "CONFIRMED") {
        return { status: current.status, idempotent: true };
      }
      throw new AppError(
        "INVALID_STATE",
        "La solicitud ya no está en un estado válido para esta acción.",
        409,
      );
    }

    const start = booking.proposedStartsAt ?? booking.requestedStartsAt;
    const end = booking.proposedEndsAt ?? booking.requestedEndsAt;

    try {
      const updated = await transitionBookingWithEvent(client, {
        salonId: SALON_ID,
        bookingId: booking.id,
        expectedFromStatus: booking.status,
        toStatus: "CONFIRMED",
        actorType: "client",
        proposedStartsAt: start,
        proposedEndsAt: end,
      });
      await markTokenUsed(client, record.id, now);

      const duration =
        booking.finalDurationMinutes ?? booking.suggestedDurationMinutes;
      await notifications.sendBookingConfirmedNotification({
        salonId: SALON_ID,
        bookingRequestId: booking.id,
        subject: BOOKING_CONFIRMED_INBOX_SUBJECT,
        bodySummary: buildBookingConfirmedBodySummary(start, duration),
        confirmPath: "/",
      });

      return { status: updated.status };
    } catch (error) {
      if (error instanceof AppError && error.code === "INVALID_STATE") {
        const current = await getBookingById(client, SALON_ID, booking.id);
        if (current?.status === "CONFIRMED") {
          return { status: current.status, idempotent: true };
        }
      }
      throw error;
    }
  }

  requireClientTransition(booking.status, "DECLINED");

  const updated = await transitionBookingWithEvent(client, {
    salonId: SALON_ID,
    bookingId: booking.id,
    expectedFromStatus: booking.status,
    toStatus: "DECLINED",
    actorType: "client",
    clearProposedTimes: true,
  });
  await markTokenUsed(client, record.id, now);
  return { status: updated.status };
}

export async function getConfirmationPreview(
  client: SupabaseClient,
  token: string,
): Promise<BookingRequest> {
  const record = await findTokenByPlaintext(client, token);
  if (!record) {
    throw new AppError("TOKEN_INVALID", "Enlace no válido.", 404);
  }

  const booking = await getBookingById(client, SALON_ID, record.bookingRequestId);
  if (!booking) {
    throw new AppError("NOT_FOUND", "Cita no encontrada.", 404);
  }

  const now = new Date();

  if (isTokenExpiredUnused(record, now)) {
    throw new AppError("TOKEN_EXPIRED", "Este enlace ya no es válido.", 410);
  }

  if (isTokenInvalidated(record, booking)) {
    throw new AppError("TOKEN_EXPIRED", "Este enlace ya no es válido.", 410);
  }

  if (
    record.usedAt &&
    booking.status !== "CONFIRMED" &&
    booking.status !== "DECLINED"
  ) {
    throw new AppError("TOKEN_EXPIRED", "Este enlace ya no es válido.", 410);
  }

  return booking;
}
