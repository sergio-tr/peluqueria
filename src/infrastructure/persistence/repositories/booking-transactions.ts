import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActorType, BookingStatus } from "@/domain/booking-state";
import { rethrowMappedPostgresError } from "@/infrastructure/persistence/postgres-errors";
import {
  mapBookingRow,
  type BookingRequest,
  type BookingRequestRow,
  type CreateBookingInput,
} from "@/infrastructure/persistence/repositories/bookings";

export type BookingTransitionInput = {
  salonId: string;
  bookingId: string;
  expectedFromStatus: BookingStatus;
  toStatus: BookingStatus;
  actorType: ActorType;
  actorId?: string;
  proposedStartsAt?: Date;
  proposedEndsAt?: Date;
  finalDurationMinutes?: number;
  holdExpiresAt?: Date;
  barberComment?: string;
  clearProposedTimes?: boolean;
  payload?: Record<string, unknown>;
};

export async function createBookingWithEvent(
  client: SupabaseClient,
  input: CreateBookingInput,
  event: {
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus;
    actorType: ActorType;
    actorId?: string;
    payload?: Record<string, unknown>;
  },
): Promise<BookingRequest> {
  const { data, error } = await client.rpc("create_booking_request_tx", {
    p_id: input.id,
    p_salon_id: input.salonId,
    p_staff_id: input.staffId,
    p_service_id: input.serviceId,
    p_hairstyle_id: input.hairstyleId ?? null,
    p_status: input.status,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_notes: input.notes ?? null,
    p_source_image_path: input.sourceImagePath ?? null,
    p_ai_job_id: input.aiJobId ?? null,
    p_requested_starts_at: input.requestedStartsAt.toISOString(),
    p_requested_ends_at: input.requestedEndsAt.toISOString(),
    p_suggested_duration_minutes: input.suggestedDurationMinutes,
    p_hold_expires_at: input.holdExpiresAt.toISOString(),
    p_consent_policy_version: input.consentPolicyVersion,
    p_from_status: event.fromStatus,
    p_to_status: event.toStatus,
    p_actor_type: event.actorType,
    p_actor_id: event.actorId ?? null,
    p_event_payload: event.payload ?? {},
  });

  if (error) rethrowMappedPostgresError(error);
  return mapBookingRow(data as BookingRequestRow);
}

export async function transitionBookingWithEvent(
  client: SupabaseClient,
  input: BookingTransitionInput,
): Promise<BookingRequest> {
  const { data, error } = await client.rpc("transition_booking_request_tx", {
    p_salon_id: input.salonId,
    p_booking_id: input.bookingId,
    p_expected_from_status: input.expectedFromStatus,
    p_to_status: input.toStatus,
    p_actor_type: input.actorType,
    p_actor_id: input.actorId ?? null,
    p_proposed_starts_at: input.proposedStartsAt?.toISOString() ?? null,
    p_proposed_ends_at: input.proposedEndsAt?.toISOString() ?? null,
    p_final_duration_minutes: input.finalDurationMinutes ?? null,
    p_hold_expires_at: input.holdExpiresAt?.toISOString() ?? null,
    p_barber_comment: input.barberComment ?? null,
    p_clear_proposed_times: input.clearProposedTimes ?? false,
    p_event_payload: input.payload ?? {},
  });

  if (error) rethrowMappedPostgresError(error);
  return mapBookingRow(data as BookingRequestRow);
}
