import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmBookingAction } from "@/application/bookings/confirm-booking";
import { AppError, toErrorResponse } from "@/domain/errors";
import { requireSupabase } from "@/infrastructure/api/require-supabase";

const postSchema = z.object({
  token: z.string().min(10),
  action: z.enum(["confirm", "decline"]),
});

export async function POST(request: Request) {
  try {
    const { supabase } = requireSupabase();
    const json: unknown = await request.json();
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("INVALID_BODY", "Solicitud inválida.", 400);
    }

    const result = await confirmBookingAction(
      supabase,
      parsed.data.token,
      parsed.data.action,
    );
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
