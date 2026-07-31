import { NextResponse } from "next/server";
import { requireAdmin } from "@/infrastructure/api/require-admin";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { toErrorResponse } from "@/domain/errors";
import { listBookings } from "@/infrastructure/persistence/repositories/bookings";
import { listActiveServices } from "@/infrastructure/persistence/repositories/catalog";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { supabase } = requireSupabase();
    const [bookings, services] = await Promise.all([
      listBookings(supabase, SALON_ID),
      listActiveServices(supabase, SALON_ID),
    ]);
    const serviceById = new Map(services.map((s) => [s.id, s]));

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        status: b.status,
        customerName: b.customerName,
        serviceName: serviceById.get(b.serviceId)?.name,
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
