import { NextResponse } from "next/server";
import { z } from "zod";
import { applyBarberTransition } from "@/application/bookings/barber-transition";
import { getBookingRequestDetail } from "@/application/bookings/create-booking-request";
import { AppError, toErrorResponse } from "@/domain/errors";
import { requireAdmin } from "@/infrastructure/api/require-admin";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { loadConfig } from "@/infrastructure/config/env";
import { getAiJobById } from "@/infrastructure/persistence/repositories/ai-jobs";
import {
  getHairstyleById,
  getServiceById,
} from "@/infrastructure/persistence/repositories/catalog";
import { createPhotoPreviewUrl } from "@/infrastructure/storage/photo-storage";
import { SALON_ID } from "@/infrastructure/supabase/client";

const transitionSchema = z.object({
  action: z.enum(["approve", "propose", "reject"]),
  proposedStartsAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  comment: z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { supabase } = requireSupabase();
    const config = loadConfig();
    const { id } = await params;
    const booking = await getBookingRequestDetail(supabase, id);

    const [service, hairstyle, job] = await Promise.all([
      getServiceById(supabase, SALON_ID, booking.serviceId),
      booking.hairstyleId
        ? getHairstyleById(supabase, SALON_ID, booking.hairstyleId)
        : Promise.resolve(null),
      booking.aiJobId
        ? getAiJobById(supabase, SALON_ID, booking.aiJobId)
        : Promise.resolve(null),
    ]);

    let sourcePreviewUrl: string | undefined;
    if (booking.sourceImagePath) {
      sourcePreviewUrl = await createPhotoPreviewUrl(
        supabase,
        config.photosBucket,
        booking.sourceImagePath,
      );
    }

    let resultPreviewUrl: string | undefined;
    if (job?.resultImagePath) {
      resultPreviewUrl = await createPhotoPreviewUrl(
        supabase,
        config.photosBucket,
        job.resultImagePath,
      );
    } else if (job?.status === "SUCCEEDED" && job.provider === "mock") {
      resultPreviewUrl = sourcePreviewUrl;
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        serviceId: booking.serviceId,
        hairstyleId: booking.hairstyleId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        notes: booking.notes,
        requestedStartsAt: booking.requestedStartsAt.toISOString(),
        requestedEndsAt: booking.requestedEndsAt.toISOString(),
        proposedStartsAt: booking.proposedStartsAt?.toISOString(),
        proposedEndsAt: booking.proposedEndsAt?.toISOString(),
        suggestedDurationMinutes: booking.suggestedDurationMinutes,
        finalDurationMinutes: booking.finalDurationMinutes,
        holdExpiresAt: booking.holdExpiresAt.toISOString(),
        barberComment: booking.barberComment,
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      },
      service,
      hairstyle,
      sourcePreviewUrl,
      resultPreviewUrl,
      resultIsMock: job?.provider === "mock",
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { supabase } = requireSupabase();
    const { id } = await params;

    const json: unknown = await request.json();
    const parsed = transitionSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("INVALID_BODY", "Acción inválida.", 400);
    }

    const result = await applyBarberTransition(supabase, {
      bookingId: id,
      ...parsed.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
