import type { SupabaseClient } from "@supabase/supabase-js";
import { assertTransition } from "@/domain/booking-state";
import { addHold, endsFromStart } from "@/domain/booking-holds";
import { suggestedDurationMinutes } from "@/domain/duration";
import { AppError } from "@/domain/errors";
import { appendBookingEvent } from "@/infrastructure/persistence/repositories/booking-events";
import {
  getBookingById,
  hasOverlappingBooking,
  insertBooking,
  type CreateBookingInput,
} from "@/infrastructure/persistence/repositories/bookings";
import { getHairstyleById, getServiceById } from "@/infrastructure/persistence/repositories/catalog";
import { getAiJobById } from "@/infrastructure/persistence/repositories/ai-jobs";
import { getPhotoById } from "@/infrastructure/persistence/repositories/photos";
import { SALON_ID, STAFF_ID } from "@/infrastructure/supabase/client";

export type CreateBookingRequestInput = {
  serviceId: string;
  hairstyleId?: string;
  photoId?: string;
  jobId?: string;
  startsAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  consentPolicyVersion: string;
};

export async function createBookingRequest(
  client: SupabaseClient,
  input: CreateBookingRequestInput,
) {
  const service = await getServiceById(client, SALON_ID, input.serviceId);
  if (!service) {
    throw new AppError("SERVICE_NOT_FOUND", "Servicio no encontrado.", 404);
  }

  if (service.requiresTryon) {
    if (!input.jobId || !input.hairstyleId) {
      throw new AppError(
        "TRYON_REQUIRED",
        "Este servicio requiere prueba virtual.",
        400,
      );
    }
    const job = await getAiJobById(client, SALON_ID, input.jobId);
    if (!job || job.status !== "SUCCEEDED") {
      throw new AppError("JOB_NOT_READY", "La vista previa aún no está lista.", 400);
    }
  }

  const hairstyle = input.hairstyleId
    ? await getHairstyleById(client, SALON_ID, input.hairstyleId)
    : null;

  const duration = suggestedDurationMinutes({
    baseMinutes: service.baseMinutes,
    complexity: hairstyle?.complexity ?? "low",
    extraMinutes: hairstyle?.extraMinutes ?? 0,
    marginMinutes: Number(process.env.DURATION_MARGIN_MINUTES ?? 0),
  });

  const startsAt = new Date(input.startsAt);
  const endsAt = endsFromStart(startsAt, duration);

  if (await hasOverlappingBooking(client, STAFF_ID, startsAt, endsAt)) {
    throw new AppError(
      "SLOT_UNAVAILABLE",
      "Ese horario ya no está disponible.",
      409,
    );
  }

  assertTransition("READY_TO_BOOK", "PENDING_BARBER_REVIEW", "client");

  let sourceImagePath: string | undefined;
  if (input.photoId) {
    const photo = await getPhotoById(client, SALON_ID, input.photoId);
    if (!photo) {
      throw new AppError("PHOTO_NOT_FOUND", "Fotografía no encontrada.", 404);
    }
    sourceImagePath = photo.storage_path;
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const bookingInput: CreateBookingInput = {
    id,
    salonId: SALON_ID,
    staffId: STAFF_ID,
    serviceId: service.id,
    hairstyleId: hairstyle?.id,
    status: "PENDING_BARBER_REVIEW",
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    notes: input.notes,
    sourceImagePath,
    aiJobId: input.jobId,
    requestedStartsAt: startsAt,
    requestedEndsAt: endsAt,
    suggestedDurationMinutes: duration,
    holdExpiresAt: addHold(now, "review"),
    consentPolicyVersion: input.consentPolicyVersion,
  };

  const booking = await insertBooking(client, bookingInput);

  await appendBookingEvent(client, {
    salonId: SALON_ID,
    bookingRequestId: booking.id,
    fromStatus: "READY_TO_BOOK",
    toStatus: "PENDING_BARBER_REVIEW",
    actorType: "client",
    payload: { serviceId: service.id },
  });

  return {
    bookingId: booking.id,
    status: booking.status,
    suggestedDurationMinutes: duration,
    endsAtHint: endsAt.toISOString(),
  };
}

export async function getBookingRequestDetail(
  client: SupabaseClient,
  bookingId: string,
) {
  const booking = await getBookingById(client, SALON_ID, bookingId);
  if (!booking) {
    throw new AppError("NOT_FOUND", "Solicitud no encontrada.", 404);
  }
  return booking;
}
