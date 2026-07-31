import { NextResponse } from "next/server";
import { getAiUsageSummary } from "@/application/ai/get-ai-usage-summary";
import { toErrorResponse } from "@/domain/errors";
import { requireAdmin } from "@/infrastructure/api/require-admin";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { supabase } = requireSupabase();
    const summary = await getAiUsageSummary(supabase, SALON_ID);
    return NextResponse.json(summary);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
