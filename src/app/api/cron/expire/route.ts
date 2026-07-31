import { NextResponse } from "next/server";
import { expireDueBookingsWithEvents } from "@/application/bookings/expire-due";
import { AppError, toErrorResponse } from "@/domain/errors";
import { requireSupabase } from "@/infrastructure/api/require-supabase";

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization");
    const secret = process.env.CRON_SECRET;
    if (!secret || auth !== `Bearer ${secret}`) {
      throw new AppError("UNAUTHORIZED", "No autorizado.", 401);
    }
    const { supabase } = requireSupabase();
    const count = await expireDueBookingsWithEvents(supabase);
    return NextResponse.json({ expired: count });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
