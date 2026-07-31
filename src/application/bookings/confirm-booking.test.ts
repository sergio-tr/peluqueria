import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  confirmBookingAction,
  getConfirmationPreview,
} from "@/application/bookings/confirm-booking";
import { bookingConfirmedNotificationKey } from "@/domain/notification-idempotency";
import { AppError } from "@/domain/errors";

const SALON_ID = "a0000000-0000-4000-8000-000000000001";
const BOOKING_ID = "b0000000-0000-4000-8000-000000000001";
const TOKEN_ID = "t0000000-0000-4000-8000-000000000001";

function tokenRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TOKEN_ID,
    booking_request_id: BOOKING_ID,
    token_hash: "abc",
    expires_at: "2026-08-10T09:00:00.000Z",
    used_at: null,
    created_at: "2026-07-31T12:00:00.000Z",
    ...overrides,
  };
}

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
    proposed_starts_at: "2026-08-05T09:00:00.000Z",
    proposed_ends_at: "2026-08-05T10:00:00.000Z",
    suggested_duration_minutes: 60,
    final_duration_minutes: 60,
    hold_expires_at: "2026-08-06T09:00:00.000Z",
    consent_policy_version: "2026-07-30",
    ai_job_id: null,
    barber_comment: null,
    created_at: "2026-07-31T12:00:00.000Z",
    updated_at: "2026-07-31T12:00:00.000Z",
  };
}

function mockClient(handlers: {
  token?: unknown;
  booking?: unknown;
  rpc?: ReturnType<typeof vi.fn>;
  idempotencyInsert?: ReturnType<typeof vi.fn>;
}) {
  const rpc = handlers.rpc ?? vi.fn();

  const from = vi.fn((table: string) => {
    if (table === "confirmation_tokens") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: handlers.token ?? null,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    }
    if (table === "booking_requests") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: handlers.booking ?? null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "idempotency_keys") {
      return {
        insert:
          handlers.idempotencyInsert ?? vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  return { from, rpc } as unknown as SupabaseClient;
}

describe("confirmBookingAction", () => {
  it("returns 404 for unknown token", async () => {
    const client = mockClient({ token: null });
    await expect(
      confirmBookingAction(client, "missing-token", "confirm"),
    ).rejects.toMatchObject({ code: "TOKEN_INVALID", status: 404 });
  });

  it("returns 410 for expired unused token", async () => {
    const client = mockClient({
      token: tokenRow({ expires_at: "2020-01-01T00:00:00.000Z" }),
      booking: bookingRow("PENDING_CUSTOMER_CONFIRMATION"),
    });
    await expect(
      confirmBookingAction(client, "expired", "confirm"),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED", status: 410 });
  });

  it("returns 410 for invalidated token after new propose", async () => {
    const client = mockClient({
      token: tokenRow({ used_at: "2026-07-31T13:00:00.000Z" }),
      booking: bookingRow("PENDING_CUSTOMER_CONFIRMATION"),
    });
    await expect(
      confirmBookingAction(client, "old-token", "confirm"),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED", status: 410 });
  });

  it("returns 409 for incompatible booking state", async () => {
    const client = mockClient({
      token: tokenRow(),
      booking: bookingRow("EXPIRED"),
    });
    await expect(
      confirmBookingAction(client, "valid", "confirm"),
    ).rejects.toMatchObject({ code: "INVALID_STATE", status: 409 });
  });

  it("confirms once and records notification idempotency key", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: bookingRow("CONFIRMED"),
      error: null,
    });
    const idempotencyInsert = vi.fn().mockResolvedValue({ error: null });
    const client = mockClient({
      token: tokenRow(),
      booking: bookingRow("PENDING_CUSTOMER_CONFIRMATION"),
      rpc,
      idempotencyInsert,
    });

    const result = await confirmBookingAction(client, "valid", "confirm");
    expect(result).toEqual({ status: "CONFIRMED" });
    expect(rpc).toHaveBeenCalledWith(
      "transition_booking_request_tx",
      expect.objectContaining({ p_to_status: "CONFIRMED" }),
    );
    expect(idempotencyInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_key: bookingConfirmedNotificationKey(BOOKING_ID),
        scope: "notification",
      }),
    );
  });

  it("returns idempotent 200 on confirm replay without second transition", async () => {
    const rpc = vi.fn();
    const client = mockClient({
      token: tokenRow({ used_at: "2026-07-31T14:00:00.000Z" }),
      booking: bookingRow("CONFIRMED"),
      rpc,
    });

    const result = await confirmBookingAction(client, "valid", "confirm");
    expect(result).toEqual({ status: "CONFIRMED", idempotent: true });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns idempotent 200 when idempotency key already exists", async () => {
    const rpc = vi.fn();
    const idempotencyInsert = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "duplicate" },
    });
    const client = mockClient({
      token: tokenRow(),
      booking: bookingRow("CONFIRMED"),
      rpc,
      idempotencyInsert,
    });

    const result = await confirmBookingAction(client, "valid", "confirm");
    expect(result).toEqual({ status: "CONFIRMED", idempotent: true });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("getConfirmationPreview", () => {
  it("allows preview for already confirmed token (GET)", async () => {
    const client = mockClient({
      token: tokenRow({ used_at: "2026-07-31T14:00:00.000Z" }),
      booking: bookingRow("CONFIRMED"),
    });
    const preview = await getConfirmationPreview(client, "valid");
    expect(preview.status).toBe("CONFIRMED");
  });

  it("returns 410 for expired preview", async () => {
    const client = mockClient({
      token: tokenRow({ expires_at: "2020-01-01T00:00:00.000Z" }),
      booking: bookingRow("PENDING_CUSTOMER_CONFIRMATION"),
    });
    await expect(getConfirmationPreview(client, "expired")).rejects.toMatchObject({
      code: "TOKEN_EXPIRED",
      status: 410,
    } satisfies Partial<AppError>);
  });
});
