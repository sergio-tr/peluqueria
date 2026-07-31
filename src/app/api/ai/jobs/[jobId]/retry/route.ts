import { NextResponse } from "next/server";
import { retryAiJob } from "@/application/ai/create-ai-job";
import { toErrorResponse } from "@/domain/errors";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { loadConfig } from "@/infrastructure/config/env";

type Params = { params: Promise<{ jobId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const config = loadConfig();
    const { supabase } = requireSupabase(config);
    const { jobId } = await params;
    const result = await retryAiJob(supabase, config, jobId);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
