import { describe, expect, it } from "vitest";
import {
  mapBookingRow,
  type BookingRequestRow,
} from "./bookings";
import { mapBookingEventInsert } from "./booking-events";
import { hashConfirmationToken } from "./confirmation-tokens";
import { toAiJobInsertRow } from "./ai-jobs";

describe("bookings mapper", () => {
  const sampleRow: BookingRequestRow = {
    id: "b1",
    salon_id: "s1",
    staff_id: "st1",
    service_id: "svc1",
    hairstyle_id: "h1",
    status: "PENDING_BARBER_REVIEW",
    customer_name: "Ana",
    customer_email: "ana@example.com",
    customer_phone: "+34600111222",
    notes: null,
    source_image_path: "salon/session/photo.jpg",
    result_image_path: null,
    requested_starts_at: "2026-08-01T10:00:00.000Z",
    requested_ends_at: "2026-08-01T11:00:00.000Z",
    proposed_starts_at: null,
    proposed_ends_at: null,
    suggested_duration_minutes: 60,
    final_duration_minutes: null,
    hold_expires_at: "2026-08-02T10:00:00.000Z",
    consent_policy_version: "2026-07-30",
    ai_job_id: null,
    barber_comment: null,
    created_at: "2026-07-31T08:00:00.000Z",
    updated_at: "2026-07-31T08:00:00.000Z",
  };

  it("maps booking row to domain shape", () => {
    const mapped = mapBookingRow(sampleRow);
    expect(mapped.customerName).toBe("Ana");
    expect(mapped.requestedStartsAt.toISOString()).toBe(
      "2026-08-01T10:00:00.000Z",
    );
    expect(mapped.suggestedDurationMinutes).toBe(60);
    expect(mapped.hairstyleId).toBe("h1");
  });

  it("maps booking event insert payload", () => {
    expect(
      mapBookingEventInsert({
        salonId: "s1",
        bookingRequestId: "b1",
        fromStatus: "READY_TO_BOOK",
        toStatus: "PENDING_BARBER_REVIEW",
        actorType: "client",
        payload: { serviceId: "svc1" },
      }),
    ).toEqual({
      salon_id: "s1",
      booking_request_id: "b1",
      from_status: "READY_TO_BOOK",
      to_status: "PENDING_BARBER_REVIEW",
      actor_type: "client",
      payload_json: { serviceId: "svc1" },
    });
  });
});

describe("confirmation token hash", () => {
  it("hashes plaintext deterministically", () => {
    const a = hashConfirmationToken("demo-token");
    const b = hashConfirmationToken("demo-token");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});

describe("ai job insert row", () => {
  it("writes expected DB columns for queued job", () => {
    const row = toAiJobInsertRow({
      id: "j1",
      salonId: "s1",
      sessionId: "sess-1",
      status: "QUEUED",
      provider: "replicate-qwen",
      model: "qwen/qwen-image-edit-plus",
      promptVersion: "v1",
      sourceImagePath: "salon/sess/photo.jpg",
      referenceImagePath: "hairstyles/references/low-fade.svg",
      consentPolicyVersion: "2026-07-30",
    });

    expect(row).toMatchObject({
      id: "j1",
      salon_id: "s1",
      session_id: "sess-1",
      status: "QUEUED",
      provider: "replicate-qwen",
      source_image_path: "salon/sess/photo.jpg",
      reference_image_path: "hairstyles/references/low-fade.svg",
    });
    expect(row.external_prediction_id).toBeNull();
  });
});
