import { NextResponse } from "next/server";
import { toErrorResponse } from "@/domain/errors";
import { requireAdmin } from "@/infrastructure/api/require-admin";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { listDemoInboxMessages } from "@/infrastructure/persistence/repositories/demo-inbox";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { supabase } = requireSupabase();
    const messages = await listDemoInboxMessages(supabase, SALON_ID);
    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        bookingId: m.bookingRequestId,
        subject: m.subject,
        bodySummary: m.bodySummary,
        confirmPath: m.confirmPath,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString(),
      })),
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
