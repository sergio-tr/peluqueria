import type { SupabaseClient } from "@supabase/supabase-js";
import { appendBookingEvent } from "@/infrastructure/persistence/repositories/booking-events";
import { expireDueBookings } from "@/infrastructure/persistence/repositories/bookings";
import { invalidateTokensForBooking } from "@/infrastructure/persistence/repositories/confirmation-tokens";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function expireDueBookingsWithEvents(
  client: SupabaseClient,
  now = new Date(),
): Promise<number> {
  const expired = await expireDueBookings(client, SALON_ID, now);

  for (const item of expired) {
    await invalidateTokensForBooking(client, item.id, now);
    await appendBookingEvent(client, {
      salonId: SALON_ID,
      bookingRequestId: item.id,
      fromStatus: item.fromStatus,
      toStatus: "EXPIRED",
      actorType: "system",
      payload: { reason: "hold_expired" },
    });
  }

  return expired.length;
}
