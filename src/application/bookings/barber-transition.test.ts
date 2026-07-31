import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyBarberTransition } from "@/application/bookings/barber-transition";
import { PROPOSAL_INBOX_SUBJECT } from "@/domain/notifications/notification-port";

const SALON_ID = "a0000000-0000-4000-8000-000000000001";
const BOOKING_ID = "b0000000-0000-4000-8000-000000000001";

function bookingRow(status: string) {
  return {
    id: BOOKING_ID,
    salon_id: SALON_ID,
    staff_id: "st1",
    service_id: "svc1",
    hairstyle_id: null,
    status,
    customer_name: "Ana",
    customer_email: "ana@example.com",
    customer_phone: "+34600111222",
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
}

function mockProposeClient() {
  const rpc = vi.fn().mockResolvedValue({
    data: bookingRow("PENDING_CUSTOMER_CONFIRMATION"),
    error: null,
  });

  const from = vi.fn((table: string) => {
    if (table === "booking_requests") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: bookingRow("PENDING_BARBER_REVIEW"),
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "confirmation_tokens") {
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "t1",
                booking_request_id: BOOKING_ID,
                token_hash: "abc",
                expires_at: "2026-08-10T09:00:00.000Z",
                used_at: null,
                created_at: "2026-07-31T12:00:00.000Z",
              },
              error: null,
            }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  return { from, rpc } as unknown as SupabaseClient;
}

describe("applyBarberTransition", () => {
  it("propose sends proposal notification with confirm path", async () => {
    const client = mockProposeClient();
    const sendProposalNotification = vi.fn().mockResolvedValue(undefined);

    const result = await applyBarberTransition(
      client,
      { bookingId: BOOKING_ID, action: "propose", durationMinutes: 60 },
      { notifications: { sendProposalNotification, sendBookingConfirmedNotification: vi.fn() } },
    );

    expect(sendProposalNotification).toHaveBeenCalledOnce();
    expect(sendProposalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        salonId: SALON_ID,
        bookingRequestId: BOOKING_ID,
        subject: PROPOSAL_INBOX_SUBJECT,
        bodySummary: "Propuesta lista. Duración 60 min.",
        confirmPath: expect.stringMatching(/^\/confirm\/.+/),
      }),
    );
    expect(result.confirmPath).toMatch(/^\/confirm\/.+/);
    expect(result.confirmPath).toBe(
      sendProposalNotification.mock.calls[0][0].confirmPath,
    );
  });
});
