import { NextResponse } from "next/server";
import { purgeEligibleImages } from "@/application/photos/purge-eligible";
import { toErrorResponse } from "@/domain/errors";
import { requireAdmin } from "@/infrastructure/api/require-admin";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { loadConfig } from "@/infrastructure/config/env";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { supabase } = requireSupabase();
    const summary = await purgeEligibleImages(supabase, loadConfig());
    return NextResponse.json(summary);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
