import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingStatus } from "@/domain/booking-state";
import { BLOCKING_STATUSES } from "@/domain/booking-state";

export type BookingRequestRow = {
  id: string;
  salon_id: string;
  staff_id: string;
  service_id: string;
  hairstyle_id: string | null;
  status: BookingStatus;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  notes: string | null;
  source_image_path: string | null;
  result_image_path: string | null;
  requested_starts_at: string;
  requested_ends_at: string;
  proposed_starts_at: string | null;
  proposed_ends_at: string | null;
  suggested_duration_minutes: number | null;
  final_duration_minutes: number | null;
  hold_expires_at: string | null;
  consent_policy_version: string | null;
  ai_job_id: string | null;
  barber_comment: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingRequest = {
  id: string;
  salonId: string;
  staffId: string;
  serviceId: string;
  hairstyleId?: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  sourceImagePath?: string;
  resultImagePath?: string;
  requestedStartsAt: Date;
  requestedEndsAt: Date;
  proposedStartsAt?: Date;
  proposedEndsAt?: Date;
  suggestedDurationMinutes: number;
  finalDurationMinutes?: number;
  holdExpiresAt: Date;
  consentPolicyVersion?: string;
  aiJobId?: string;
  barberComment?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateBookingInput = {
  id: string;
  salonId: string;
  staffId: string;
  serviceId: string;
  hairstyleId?: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  sourceImagePath?: string;
  aiJobId?: string;
  requestedStartsAt: Date;
  requestedEndsAt: Date;
  suggestedDurationMinutes: number;
  holdExpiresAt: Date;
  consentPolicyVersion: string;
};

export type UpdateBookingInput = {
  status?: BookingStatus;
  proposedStartsAt?: Date;
  proposedEndsAt?: Date;
  finalDurationMinutes?: number;
  holdExpiresAt?: Date;
  barberComment?: string;
};

export function mapBookingRow(row: BookingRequestRow): BookingRequest {
  return {
    id: row.id,
    salonId: row.salon_id,
    staffId: row.staff_id,
    serviceId: row.service_id,
    hairstyleId: row.hairstyle_id ?? undefined,
    status: row.status,
    customerName: row.customer_name ?? "",
    customerEmail: row.customer_email ?? "",
    customerPhone: row.customer_phone ?? "",
    notes: row.notes ?? undefined,
    sourceImagePath: row.source_image_path ?? undefined,
    resultImagePath: row.result_image_path ?? undefined,
    requestedStartsAt: new Date(row.requested_starts_at),
    requestedEndsAt: new Date(row.requested_ends_at),
    proposedStartsAt: row.proposed_starts_at
      ? new Date(row.proposed_starts_at)
      : undefined,
    proposedEndsAt: row.proposed_ends_at
      ? new Date(row.proposed_ends_at)
      : undefined,
    suggestedDurationMinutes: row.suggested_duration_minutes ?? 0,
    finalDurationMinutes: row.final_duration_minutes ?? undefined,
    holdExpiresAt: new Date(row.hold_expires_at ?? row.created_at),
    consentPolicyVersion: row.consent_policy_version ?? undefined,
    aiJobId: row.ai_job_id ?? undefined,
    barberComment: row.barber_comment ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toInsertRow(input: CreateBookingInput) {
  const now = new Date().toISOString();
  return {
    id: input.id,
    salon_id: input.salonId,
    staff_id: input.staffId,
    service_id: input.serviceId,
    hairstyle_id: input.hairstyleId ?? null,
    status: input.status,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    notes: input.notes ?? null,
    source_image_path: input.sourceImagePath ?? null,
    ai_job_id: input.aiJobId ?? null,
    requested_starts_at: input.requestedStartsAt.toISOString(),
    requested_ends_at: input.requestedEndsAt.toISOString(),
    suggested_duration_minutes: input.suggestedDurationMinutes,
    hold_expires_at: input.holdExpiresAt.toISOString(),
    consent_policy_version: input.consentPolicyVersion,
    created_at: now,
    updated_at: now,
  };
}

const BOOKING_COLUMNS =
  "id,salon_id,staff_id,service_id,hairstyle_id,status,customer_name,customer_email,customer_phone,notes,source_image_path,result_image_path,requested_starts_at,requested_ends_at,proposed_starts_at,proposed_ends_at,suggested_duration_minutes,final_duration_minutes,hold_expires_at,consent_policy_version,ai_job_id,barber_comment,created_at,updated_at";

export async function insertBooking(
  client: SupabaseClient,
  input: CreateBookingInput,
): Promise<BookingRequest> {
  const { data, error } = await client
    .from("booking_requests")
    .insert(toInsertRow(input))
    .select(BOOKING_COLUMNS)
    .single();
  if (error) throw error;
  return mapBookingRow(data as BookingRequestRow);
}

export async function getBookingById(
  client: SupabaseClient,
  salonId: string,
  bookingId: string,
): Promise<BookingRequest | null> {
  const { data, error } = await client
    .from("booking_requests")
    .select(BOOKING_COLUMNS)
    .eq("salon_id", salonId)
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBookingRow(data as BookingRequestRow) : null;
}

export async function listBookings(
  client: SupabaseClient,
  salonId: string,
): Promise<BookingRequest[]> {
  const { data, error } = await client
    .from("booking_requests")
    .select(BOOKING_COLUMNS)
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as BookingRequestRow[]).map(mapBookingRow);
}

export async function updateBooking(
  client: SupabaseClient,
  salonId: string,
  bookingId: string,
  patch: UpdateBookingInput,
): Promise<BookingRequest> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.proposedStartsAt !== undefined) {
    row.proposed_starts_at = patch.proposedStartsAt.toISOString();
  }
  if (patch.proposedEndsAt !== undefined) {
    row.proposed_ends_at = patch.proposedEndsAt.toISOString();
  }
  if (patch.finalDurationMinutes !== undefined) {
    row.final_duration_minutes = patch.finalDurationMinutes;
  }
  if (patch.holdExpiresAt !== undefined) {
    row.hold_expires_at = patch.holdExpiresAt.toISOString();
  }
  if (patch.barberComment !== undefined) {
    row.barber_comment = patch.barberComment;
  }

  const { data, error } = await client
    .from("booking_requests")
    .update(row)
    .eq("salon_id", salonId)
    .eq("id", bookingId)
    .select(BOOKING_COLUMNS)
    .single();
  if (error) throw error;
  return mapBookingRow(data as BookingRequestRow);
}

export async function hasOverlappingBooking(
  client: SupabaseClient,
  staffId: string,
  startsAt: Date,
  endsAt: Date,
  exceptBookingId?: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("booking_requests")
    .select(
      "id,status,requested_starts_at,requested_ends_at,proposed_starts_at,proposed_ends_at",
    )
    .eq("staff_id", staffId)
    .in("status", BLOCKING_STATUSES);
  if (error) throw error;

  return (data ?? []).some((row) => {
    if (exceptBookingId && row.id === exceptBookingId) return false;
    const s = new Date(row.proposed_starts_at ?? row.requested_starts_at);
    const e = new Date(row.proposed_ends_at ?? row.requested_ends_at);
    return startsAt < e && endsAt > s;
  });
}

export async function expireDueBookings(
  client: SupabaseClient,
  salonId: string,
  now = new Date(),
): Promise<Array<{ id: string; fromStatus: BookingStatus }>> {
  const { data, error } = await client
    .from("booking_requests")
    .select("id,status,hold_expires_at")
    .eq("salon_id", salonId)
    .in("status", ["PENDING_BARBER_REVIEW", "PENDING_CUSTOMER_CONFIRMATION"])
    .lte("hold_expires_at", now.toISOString());
  if (error) throw error;

  const expired: Array<{ id: string; fromStatus: BookingStatus }> = [];
  for (const row of data ?? []) {
    const { error: updateError } = await client
      .from("booking_requests")
      .update({
        status: "EXPIRED",
        updated_at: now.toISOString(),
      })
      .eq("id", row.id)
      .eq("salon_id", salonId);
    if (updateError) throw updateError;
    expired.push({ id: row.id, fromStatus: row.status as BookingStatus });
  }
  return expired;
}
