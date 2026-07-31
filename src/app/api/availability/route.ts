import { NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { AppError, toErrorResponse } from "@/domain/errors";
import { listSlotsForDay } from "@/domain/availability";
import { suggestedDurationMinutes } from "@/domain/duration";
import { loadConfig } from "@/infrastructure/config/env";
import {
  assertSupabaseStore,
  createPersistenceStore,
} from "@/infrastructure/persistence/store-factory";
import {
  listActiveHairstyles,
  listActiveServices,
  listAvailabilityRules,
} from "@/infrastructure/persistence/repositories/catalog";
import { SALON_ID, STAFF_ID } from "@/infrastructure/supabase/client";

const querySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hairstyleId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const config = loadConfig();
    const store = createPersistenceStore(config);
    if (store.kind !== "supabase") {
      throw new AppError(
        "SUPABASE_REQUIRED",
        "Availability requires DATA_STORE=supabase.",
        503,
      );
    }
    assertSupabaseStore(store);

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      serviceId: url.searchParams.get("serviceId"),
      date: url.searchParams.get("date"),
      hairstyleId: url.searchParams.get("hairstyleId") ?? undefined,
    });
    if (!parsed.success) {
      throw new AppError("INVALID_QUERY", "Parámetros inválidos.", 400);
    }

    const services = await listActiveServices(store.supabase, SALON_ID);
    const service = services.find((s) => s.id === parsed.data.serviceId);
    if (!service) {
      throw new AppError("SERVICE_NOT_FOUND", "Servicio no encontrado.", 404);
    }

    const hairstyles = await listActiveHairstyles(store.supabase, SALON_ID);
    const hairstyle = parsed.data.hairstyleId
      ? hairstyles.find((h) => h.id === parsed.data.hairstyleId)
      : undefined;

    const duration = suggestedDurationMinutes({
      baseMinutes: service.baseMinutes,
      complexity: hairstyle?.complexity ?? "low",
      extraMinutes: hairstyle?.extraMinutes ?? 0,
      marginMinutes: Number(process.env.DURATION_MARGIN_MINUTES ?? 0),
    });

    const rules = await listAvailabilityRules(
      store.supabase,
      SALON_ID,
      STAFF_ID,
    );

    // Busy intervals from blocking bookings land in phase 1D/2B; empty for 1B.
    const slots = listSlotsForDay({
      dateYmd: parsed.data.date,
      rules,
      busy: [],
      durationMinutes: duration,
    });

    return NextResponse.json({
      durationMinutes: duration,
      timezone: "Europe/Madrid",
      slots: slots.map((s) => ({
        startsAt: s.toISOString(),
        endsAt: addMinutes(s, duration).toISOString(),
      })),
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
