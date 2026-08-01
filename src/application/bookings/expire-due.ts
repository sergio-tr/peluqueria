import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingStatus } from "@/domain/booking-state";
import { transitionBookingWithEvent } from "@/infrastructure/persistence/repositories/booking-transactions";
import { invalidateTokensForBooking } from "@/infrastructure/persistence/repositories/confirmation-tokens";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function expireDueBookingsWithEvents(
  client: SupabaseClient,
  now = new Date(),
): Promise<number> {
  const due = await listDueBookings(client, SALON_ID, now);
  let count = 0;

  for (const item of due) {
    await transitionBookingWithEvent(client, {
      salonId: SALON_ID,
      bookingId: item.id,
      expectedFromStatus: item.status,
      toStatus: "EXPIRED",
      actorType: "system",
      clearProposedTimes: true,
      payload: { reason: "hold_expired" },
    });
    await invalidateTokensForBooking(client, item.id, now);
    count += 1;
  }

  return count;
}

async function listDueBookings(
  client: SupabaseClient,
  salonId: string,
  now: Date,
): Promise<Array<{ id: string; status: BookingStatus }>> {
  const { data, error } = await client
    .from("booking_requests")
    .select("id,status")
    .eq("salon_id", salonId)
    .in("status", ["PENDING_BARBER_REVIEW", "PENDING_CUSTOMER_CONFIRMATION"])
    .lte("hold_expires_at", now.toISOString());
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    status: row.status as BookingStatus,
  }));
}
