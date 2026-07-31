import { NextResponse } from "next/server";
import { deletePhotoAsAdmin } from "@/application/photos/delete-photo-admin";
import { toErrorResponse } from "@/domain/errors";
import { requireAdmin } from "@/infrastructure/api/require-admin";
import { requireSupabase } from "@/infrastructure/api/require-supabase";
import { loadConfig } from "@/infrastructure/config/env";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as { photoId?: string };
    if (!body.photoId) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "photoId es obligatorio." },
        { status: 400 },
      );
    }
    const { supabase } = requireSupabase();
    const result = await deletePhotoAsAdmin(
      supabase,
      loadConfig(),
      body.photoId,
    );
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
