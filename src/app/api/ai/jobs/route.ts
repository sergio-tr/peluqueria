import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiJob } from "@/application/ai/create-ai-job";
import { AppError, toErrorResponse } from "@/domain/errors";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { loadConfig } from "@/infrastructure/config/env";
import { clientIpFromRequest, hashIp } from "@/infrastructure/ip-hash";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  photoId: z.string().uuid(),
  hairstyleId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const config = loadConfig();
    const { supabase } = requireSupabase(config);
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("INVALID_BODY", "Datos de generación inválidos.", 400);
    }

    const ipHash = hashIp(clientIpFromRequest(request));
    const result = await createAiJob(supabase, config, {
      ...parsed.data,
      ipHash,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
