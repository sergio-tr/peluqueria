import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingStatus } from "@/domain/booking-state";
import type { ActorType } from "@/domain/booking-state";

export type BookingEventInput = {
  salonId: string;
  bookingRequestId: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actorType: ActorType;
  actorId?: string;
  payload?: Record<string, unknown>;
};

export async function appendBookingEvent(
  client: SupabaseClient,
  input: BookingEventInput,
): Promise<void> {
  const { error } = await client.from("booking_events").insert({
    salon_id: input.salonId,
    booking_request_id: input.bookingRequestId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    actor_type: input.actorType,
    actor_id: input.actorId ?? null,
    payload_json: input.payload ?? {},
  });
  if (error) throw error;
}

export type BookingEventRow = {
  salon_id: string;
  booking_request_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  actor_type: string;
  payload_json: Record<string, unknown>;
};

export function mapBookingEventInsert(input: BookingEventInput): BookingEventRow {
  return {
    salon_id: input.salonId,
    booking_request_id: input.bookingRequestId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    actor_type: input.actorType,
    payload_json: input.payload ?? {},
  };
}
