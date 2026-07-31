import { NextResponse } from "next/server";
import { z } from "zod";
import { createBookingRequest } from "@/application/bookings/create-booking-request";
import { AppError, toErrorResponse } from "@/domain/errors";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { listBookings } from "@/infrastructure/persistence/repositories/bookings";
import { SALON_ID } from "@/infrastructure/supabase/client";

const bodySchema = z.object({
  serviceId: z.string().min(1),
  hairstyleId: z.string().optional(),
  photoId: z.string().optional(),
  jobId: z.string().optional(),
  startsAt: z.string().datetime(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  notes: z.string().max(500).optional(),
  consentPolicyVersion: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { supabase } = requireSupabase();
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("INVALID_BODY", "Datos de reserva inválidos.", 400);
    }

    const result = await createBookingRequest(supabase, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function GET() {
  try {
    const { supabase } = requireSupabase();
    const bookings = await listBookings(supabase, SALON_ID);
    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        status: b.status,
        serviceId: b.serviceId,
        customerName: b.customerName,
        requestedStartsAt: b.requestedStartsAt.toISOString(),
        proposedStartsAt: b.proposedStartsAt?.toISOString(),
        holdExpiresAt: b.holdExpiresAt.toISOString(),
      })),
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
