import { NextResponse } from "next/server";
import { toErrorResponse } from "@/domain/errors";
import { loadConfig } from "@/infrastructure/config/env";
import {
  createPersistenceStore,
  assertSupabaseStore,
} from "@/infrastructure/persistence/store-factory";
import { listActiveServices } from "@/infrastructure/persistence/repositories/catalog";
import { SALON_ID } from "@/infrastructure/supabase/client";
import { AppError } from "@/domain/errors";

export async function GET() {
  try {
    const config = loadConfig();
    const store = createPersistenceStore(config);
    if (store.kind !== "supabase") {
      throw new AppError(
        "SUPABASE_REQUIRED",
        "Master data requires DATA_STORE=supabase.",
        503,
      );
    }
    assertSupabaseStore(store);
    const services = await listActiveServices(store.supabase, SALON_ID);
    return NextResponse.json({ services });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
