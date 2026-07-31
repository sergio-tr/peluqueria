import { NextResponse } from "next/server";
import { processReplicateWebhook } from "@/application/ai/process-replicate-webhook";
import { AppError, toErrorResponse } from "@/domain/errors";
import { verifyReplicateWebhookSignature } from "@/infrastructure/ai/replicate-webhook-signature";
import { isRemoteRuntime } from "@/infrastructure/ai/runtime-env";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { loadConfig } from "@/infrastructure/config/env";
import { SALON_ID } from "@/infrastructure/supabase/client";

export async function POST(request: Request) {
  try {
    const config = loadConfig();
    const { supabase } = requireSupabase(config);
    const secret = process.env.REPLICATE_WEBHOOK_SECRET;
    const rawBody = await request.text();
    const webhookId = request.headers.get("webhook-id");

    if (isRemoteRuntime() && !secret) {
      throw new AppError(
        "WEBHOOK_NOT_CONFIGURED",
        "Webhook no configurado.",
        503,
      );
    }

    if (secret) {
      const ok = verifyReplicateWebhookSignature(
        rawBody,
        webhookId,
        request.headers.get("webhook-timestamp"),
        request.headers.get("webhook-signature"),
        secret,
      );
      if (!ok) {
        throw new AppError("INVALID_SIGNATURE", "Firma inválida.", 401);
      }
    }

    if (!webhookId) {
      throw new AppError("INVALID_WEBHOOK", "Webhook inválido.", 400);
    }

    const payload = JSON.parse(rawBody) as Parameters<
      typeof processReplicateWebhook
    >[3]["payload"];

    const result = await processReplicateWebhook(supabase, config, SALON_ID, {
      webhookId,
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
