import { NextResponse } from "next/server";
import { AppError, toErrorResponse } from "@/domain/errors";
import { loadConfig } from "@/infrastructure/config/env";
import {
  assertSupabaseStore,
  createPersistenceStore,
} from "@/infrastructure/persistence/store-factory";
import { listActiveHairstyles } from "@/infrastructure/persistence/repositories/catalog";
import { SALON_ID } from "@/infrastructure/supabase/client";

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
    const hairstyles = await listActiveHairstyles(store.supabase, SALON_ID);
    return NextResponse.json({ hairstyles });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
