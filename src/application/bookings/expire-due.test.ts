import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { expireDueBookingsWithEvents } from "@/application/bookings/expire-due";

describe("expireDueBookingsWithEvents", () => {
  it("expires due holds and releases slot atomically", async () => {
    const dueRows = [
      { id: "b1", status: "PENDING_BARBER_REVIEW" },
      { id: "b2", status: "PENDING_CUSTOMER_CONFIRMATION" },
    ];

    const rpc = vi.fn().mockResolvedValue({
      data: { id: "b1", status: "EXPIRED" },
      error: null,
    });

    const lteMock = vi.fn().mockResolvedValue({ data: dueRows, error: null });
    const inMock = vi.fn().mockReturnValue({ lte: lteMock });
    const eqSalonMock = vi.fn().mockReturnValue({ in: inMock });

    const tokenUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const from = vi.fn((table: string) => {
      if (table === "booking_requests") {
        return {
          select: vi.fn().mockReturnValue({
            eq: eqSalonMock,
          }),
        };
      }
      if (table === "confirmation_tokens") {
        return { update: tokenUpdate };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const client = { from, rpc } as unknown as SupabaseClient;
    const now = new Date("2026-08-01T00:00:00.000Z");

    const count = await expireDueBookingsWithEvents(client, now);

    expect(count).toBe(2);
    expect(inMock).toHaveBeenCalledWith("status", [
      "PENDING_BARBER_REVIEW",
      "PENDING_CUSTOMER_CONFIRMATION",
    ]);
    expect(lteMock).toHaveBeenCalledWith(
      "hold_expires_at",
      now.toISOString(),
    );
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith(
      "transition_booking_request_tx",
      expect.objectContaining({
        p_to_status: "EXPIRED",
        p_clear_proposed_times: true,
        p_event_payload: { reason: "hold_expired" },
      }),
    );
  });

  it("returns zero when nothing is due", async () => {
    const lteMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const inMock = vi.fn().mockReturnValue({ lte: lteMock });
    const eqSalonMock = vi.fn().mockReturnValue({ in: inMock });

    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue({ eq: eqSalonMock }),
    }));

    const client = { from, rpc: vi.fn() } as unknown as SupabaseClient;
    const count = await expireDueBookingsWithEvents(client);
    expect(count).toBe(0);
  });
});
