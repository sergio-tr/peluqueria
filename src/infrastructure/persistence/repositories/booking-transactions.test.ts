import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/domain/errors";
import {
  createBookingWithEvent,
  transitionBookingWithEvent,
} from "@/infrastructure/persistence/repositories/booking-transactions";

const bookingRow = {
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

describe("booking-transactions", () => {
  it("createBookingWithEvent calls RPC and maps row", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: bookingRow, error: null });
    const client = { rpc } as unknown as SupabaseClient;

    const booking = await createBookingWithEvent(
      client,
      {
        id: "booking-1",
        salonId: bookingRow.salon_id,
        staffId: bookingRow.staff_id,
        serviceId: bookingRow.service_id,
        status: "PENDING_BARBER_REVIEW",
        customerName: "Luis",
        customerEmail: "luis@example.com",
        customerPhone: "+34600999888",
        requestedStartsAt: new Date("2026-08-05T09:00:00.000Z"),
        requestedEndsAt: new Date("2026-08-05T10:00:00.000Z"),
        suggestedDurationMinutes: 60,
        holdExpiresAt: new Date("2026-08-06T09:00:00.000Z"),
        consentPolicyVersion: "2026-07-30",
      },
      {
        fromStatus: "READY_TO_BOOK",
        toStatus: "PENDING_BARBER_REVIEW",
        actorType: "client",
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "create_booking_request_tx",
      expect.objectContaining({
        p_id: "booking-1",
        p_to_status: "PENDING_BARBER_REVIEW",
      }),
    );
    expect(booking.status).toBe("PENDING_BARBER_REVIEW");
  });

  it("maps exclusion violation on create to SLOT_UNAVAILABLE", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23P01", message: "overlap" },
    });
    const client = { rpc } as unknown as SupabaseClient;

    await expect(
      createBookingWithEvent(
        client,
        {
          id: "booking-2",
          salonId: bookingRow.salon_id,
          staffId: bookingRow.staff_id,
          serviceId: bookingRow.service_id,
          status: "PENDING_BARBER_REVIEW",
          customerName: "Ana",
          customerEmail: "ana@example.com",
          customerPhone: "+34600111222",
          requestedStartsAt: new Date("2026-08-05T09:00:00.000Z"),
          requestedEndsAt: new Date("2026-08-05T10:00:00.000Z"),
          suggestedDurationMinutes: 60,
          holdExpiresAt: new Date("2026-08-06T09:00:00.000Z"),
          consentPolicyVersion: "2026-07-30",
        },
        {
          fromStatus: "READY_TO_BOOK",
          toStatus: "PENDING_BARBER_REVIEW",
          actorType: "client",
        },
      ),
    ).rejects.toMatchObject({
      code: "SLOT_UNAVAILABLE",
      status: 409,
    } satisfies Partial<AppError>);
  });

  it("double-book race: second create loses with 409", async () => {
    let calls = 0;
    const rpc = vi.fn().mockImplementation(async () => {
      calls += 1;
      if (calls === 1) {
        return { data: bookingRow, error: null };
      }
      return {
        data: null,
        error: {
          code: "23P01",
          message: "conflicting key value violates exclusion constraint",
        },
      };
    });
    const client = { rpc } as unknown as SupabaseClient;

    const input = {
      id: "booking-x",
      salonId: bookingRow.salon_id,
      staffId: bookingRow.staff_id,
      serviceId: bookingRow.service_id,
      status: "PENDING_BARBER_REVIEW" as const,
      customerName: "Race",
      customerEmail: "race@example.com",
      customerPhone: "+34600333444",
      requestedStartsAt: new Date("2026-08-05T09:00:00.000Z"),
      requestedEndsAt: new Date("2026-08-05T10:00:00.000Z"),
      suggestedDurationMinutes: 60,
      holdExpiresAt: new Date("2026-08-06T09:00:00.000Z"),
      consentPolicyVersion: "2026-07-30",
    };
    const event = {
      fromStatus: "READY_TO_BOOK" as const,
      toStatus: "PENDING_BARBER_REVIEW" as const,
      actorType: "client" as const,
    };

    await expect(
      Promise.all([
        createBookingWithEvent(client, { ...input, id: "booking-a" }, event),
        createBookingWithEvent(client, { ...input, id: "booking-b" }, event),
      ]),
    ).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE", status: 409 });
  });

  it("transitionBookingWithEvent releases slot on reject", async () => {
    const rejectedRow = { ...bookingRow, status: "REJECTED" };
    const rpc = vi.fn().mockResolvedValue({ data: rejectedRow, error: null });
    const client = { rpc } as unknown as SupabaseClient;

    const booking = await transitionBookingWithEvent(client, {
      salonId: bookingRow.salon_id,
      bookingId: bookingRow.id,
      expectedFromStatus: "PENDING_BARBER_REVIEW",
      toStatus: "REJECTED",
      actorType: "barber",
    });

    expect(rpc).toHaveBeenCalledWith(
      "transition_booking_request_tx",
      expect.objectContaining({
        p_to_status: "REJECTED",
        p_expected_from_status: "PENDING_BARBER_REVIEW",
      }),
    );
    expect(booking.status).toBe("REJECTED");
  });
});
