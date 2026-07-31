import type { SupabaseClient } from "@supabase/supabase-js";

export type DemoInboxRow = {
  id: string;
  salon_id: string;
  booking_request_id: string;
  subject: string;
  body_summary: string;
  confirm_path: string;
  created_at: string;
  read_at: string | null;
};

export type DemoInboxMessage = {
  id: string;
  bookingRequestId: string;
  subject: string;
  bodySummary: string;
  confirmPath: string;
  createdAt: Date;
  readAt?: Date;
};

export function mapDemoInboxMessage(row: DemoInboxRow): DemoInboxMessage {
  return {
    id: row.id,
    bookingRequestId: row.booking_request_id,
    subject: row.subject,
    bodySummary: row.body_summary,
    confirmPath: row.confirm_path,
    createdAt: new Date(row.created_at),
    readAt: row.read_at ? new Date(row.read_at) : undefined,
  };
}

export async function insertDemoInboxMessage(
  client: SupabaseClient,
  input: {
    id: string;
    salonId: string;
    bookingRequestId: string;
    subject: string;
    bodySummary: string;
    confirmPath: string;
  },
): Promise<DemoInboxMessage> {
  const { data, error } = await client
    .from("demo_inbox_messages")
    .insert({
      id: input.id,
      salon_id: input.salonId,
      booking_request_id: input.bookingRequestId,
      subject: input.subject,
      body_summary: input.bodySummary,
      confirm_path: input.confirmPath,
    })
    .select(
      "id,salon_id,booking_request_id,subject,body_summary,confirm_path,created_at,read_at",
    )
    .single();
  if (error) throw error;
  return mapDemoInboxMessage(data as DemoInboxRow);
}

export async function listDemoInboxMessages(
  client: SupabaseClient,
  salonId: string,
): Promise<DemoInboxMessage[]> {
  const { data, error } = await client
    .from("demo_inbox_messages")
    .select(
      "id,salon_id,booking_request_id,subject,body_summary,confirm_path,created_at,read_at",
    )
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DemoInboxRow[]).map(mapDemoInboxMessage);
}
