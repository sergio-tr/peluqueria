import { NextResponse } from "next/server";
import { getConfirmationPreview } from "@/application/bookings/confirm-booking";
import { toErrorResponse } from "@/domain/errors";
import { formatSalonLocal } from "@/domain/availability";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { getServiceById } from "@/infrastructure/persistence/repositories/catalog";
import { SALON_ID } from "@/infrastructure/supabase/client";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { supabase } = requireSupabase();
    const { token } = await params;
    const booking = await getConfirmationPreview(supabase, token);
    const service = await getServiceById(supabase, SALON_ID, booking.serviceId);
    const start = booking.proposedStartsAt ?? booking.requestedStartsAt;
    const duration =
      booking.finalDurationMinutes ?? booking.suggestedDurationMinutes;

    return NextResponse.json({
      status: booking.status,
      serviceName: service?.name,
      startsAtLocal: formatSalonLocal(start),
      durationMinutes: duration,
      customerName: booking.customerName,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
