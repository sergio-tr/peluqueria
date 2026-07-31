import { NextResponse } from "next/server";
import { expireDueBookingsWithEvents } from "@/application/bookings/expire-due";
import { toErrorResponse } from "@/domain/errors";
import { requireAdmin } from "@/infrastructure/api/require-admin";
import { requireSupabase } from "@/infrastructure/api/require-supabase";

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const { supabase } = requireSupabase();
    const count = await expireDueBookingsWithEvents(supabase);
    return NextResponse.json({ expired: count });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
