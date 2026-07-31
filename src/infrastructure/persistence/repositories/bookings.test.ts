import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapBookingRow, type BookingRequestRow } from "@/infrastructure/persistence/repositories/bookings";
import { mapBookingEventInsert } from "@/infrastructure/persistence/repositories/booking-events";

describe("booking create persistence shape", () => {
  it("insertBooking writes expected row and appendBookingEvent records transition", async () => {
    const insertedBooking: BookingRequestRow = {
      id: "booking-1",
      salon_id: "a0000000-0000-4000-8000-000000000001",
      staff_id: "a0000000-0000-4000-8000-000000000010",
      service_id: "svc-1",
      hairstyle_id: null,
      status: "PENDING_BARBER_REVIEW",
      customer_name: "Luis",
      customer_email: "luis@example.com",
      customer_phone: "+34600999888",
      notes: null,
      source_image_path: null,
      result_image_path: null,
      requested_starts_at: "2026-08-05T09:00:00.000Z",
      requested_ends_at: "2026-08-05T10:00:00.000Z",
      proposed_starts_at: null,
      proposed_ends_at: null,
      suggested_duration_minutes: 60,
      final_duration_minutes: null,
      hold_expires_at: "2026-08-06T09:00:00.000Z",
      consent_policy_version: "2026-07-30",
      ai_job_id: null,
      barber_comment: null,
      created_at: "2026-07-31T12:00:00.000Z",
      updated_at: "2026-07-31T12:00:00.000Z",
    };

    const bookingInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: insertedBooking, error: null }),
      }),
    });
    const eventInsert = vi.fn().mockResolvedValue({ error: null });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "booking_requests") {
          return { insert: bookingInsert };
        }
        if (table === "booking_events") {
          return { insert: eventInsert };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const { insertBooking } = await import(
      "@/infrastructure/persistence/repositories/bookings"
    );
    const { appendBookingEvent } = await import(
      "@/infrastructure/persistence/repositories/booking-events"
    );

    const booking = await insertBooking(client, {
      id: "booking-1",
      salonId: insertedBooking.salon_id,
      staffId: insertedBooking.staff_id,
      serviceId: insertedBooking.service_id,
      status: "PENDING_BARBER_REVIEW",
      customerName: "Luis",
      customerEmail: "luis@example.com",
      customerPhone: "+34600999888",
      requestedStartsAt: new Date("2026-08-05T09:00:00.000Z"),
      requestedEndsAt: new Date("2026-08-05T10:00:00.000Z"),
      suggestedDurationMinutes: 60,
      holdExpiresAt: new Date("2026-08-06T09:00:00.000Z"),
      consentPolicyVersion: "2026-07-30",
    });

    await appendBookingEvent(client, {
      salonId: insertedBooking.salon_id,
      bookingRequestId: booking.id,
      fromStatus: "READY_TO_BOOK",
      toStatus: "PENDING_BARBER_REVIEW",
      actorType: "client",
    });

    expect(mapBookingRow(insertedBooking).status).toBe("PENDING_BARBER_REVIEW");
    expect(bookingInsert).toHaveBeenCalledOnce();
    expect(eventInsert).toHaveBeenCalledWith({
      ...mapBookingEventInsert({
        salonId: insertedBooking.salon_id,
        bookingRequestId: "booking-1",
        fromStatus: "READY_TO_BOOK",
        toStatus: "PENDING_BARBER_REVIEW",
        actorType: "client",
      }),
      actor_id: null,
    });
  });
});
