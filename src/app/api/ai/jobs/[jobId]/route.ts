import { NextResponse } from "next/server";
import { AppError, toErrorResponse } from "@/domain/errors";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { loadConfig } from "@/infrastructure/config/env";
import { getAiJobById } from "@/infrastructure/persistence/repositories/ai-jobs";
import { createPhotoPreviewUrl } from "@/infrastructure/storage/photo-storage";
import { SALON_ID } from "@/infrastructure/supabase/client";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { supabase } = requireSupabase();
    const config = loadConfig();
    const { jobId } = await params;
    const job = await getAiJobById(supabase, SALON_ID, jobId);
    if (!job) {
      throw new AppError("JOB_NOT_FOUND", "Trabajo no encontrado.", 404);
    }

    let resultPreviewUrl: string | undefined;
    if (job.status === "SUCCEEDED") {
      if (job.resultImagePath) {
        resultPreviewUrl = await createPhotoPreviewUrl(
          supabase,
          config.resultsBucket,
          job.resultImagePath,
        );
      } else if (job.provider === "mock") {
        resultPreviewUrl = await createPhotoPreviewUrl(
          supabase,
          config.photosBucket,
          job.sourceImagePath,
        );
      }
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      provider: job.provider,
      isMock: job.provider === "mock",
      errorCode: job.errorCode,
      resultPreviewUrl,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
