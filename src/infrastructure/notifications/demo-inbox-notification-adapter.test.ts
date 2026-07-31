import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BOOKING_CONFIRMED_INBOX_SUBJECT,
  PROPOSAL_INBOX_SUBJECT,
} from "@/domain/notifications/notification-port";
import { DemoInboxNotificationAdapter } from "./demo-inbox-notification-adapter";

const SALON_ID = "a0000000-0000-4000-8000-000000000001";
const BOOKING_ID = "b0000000-0000-4000-8000-000000000001";

function mockInboxClient(insert = vi.fn()) {
  const from = vi.fn((table: string) => {
    if (table === "demo_inbox_messages") {
      return {
        insert: insert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "m1",
                salon_id: SALON_ID,
                booking_request_id: BOOKING_ID,
                subject: PROPOSAL_INBOX_SUBJECT,
                body_summary: "Propuesta lista. Duración 60 min.",
                confirm_path: "/confirm/tok",
                created_at: "2026-07-31T12:00:00.000Z",
                read_at: null,
              },
              error: null,
            }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
  return { from } as unknown as SupabaseClient;
}

describe("DemoInboxNotificationAdapter", () => {
  it("persists proposal notification with confirm path", async () => {
    const insert = vi.fn();
    const adapter = new DemoInboxNotificationAdapter(mockInboxClient(insert));

    await adapter.sendProposalNotification({
      salonId: SALON_ID,
      bookingRequestId: BOOKING_ID,
      subject: PROPOSAL_INBOX_SUBJECT,
      bodySummary: "Propuesta lista. Duración 60 min.",
      confirmPath: "/confirm/demo-token",
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        salon_id: SALON_ID,
        booking_request_id: BOOKING_ID,
        subject: PROPOSAL_INBOX_SUBJECT,
        confirm_path: "/confirm/demo-token",
      }),
    );
  });

  it("persists booking confirmed notification", async () => {
    const insert = vi.fn();
    const adapter = new DemoInboxNotificationAdapter(mockInboxClient(insert));

    await adapter.sendBookingConfirmedNotification({
      salonId: SALON_ID,
      bookingRequestId: BOOKING_ID,
      subject: BOOKING_CONFIRMED_INBOX_SUBJECT,
      bodySummary: "Cita confirmada.",
      confirmPath: "/",
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: BOOKING_CONFIRMED_INBOX_SUBJECT,
        confirm_path: "/",
      }),
    );
  });
});
