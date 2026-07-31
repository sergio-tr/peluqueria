import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadPhoto } from "@/application/photos/upload-photo";
import { AppError, toErrorResponse } from "@/domain/errors";
import { loadConfig } from "@/infrastructure/config/env";
import {
  assertSupabaseStore,
  createPersistenceStore,
} from "@/infrastructure/persistence/store-factory";

const consentSchema = z.object({
  sessionId: z.string().min(1),
  consentPolicyVersion: z.string().min(1),
  isOwnImage: z.literal("true").or(z.literal(true)).transform(() => true as const),
});

export async function POST(request: Request) {
  try {
    const config = loadConfig();

    if (!config.photoUploadEnabled) {
      throw new AppError(
        "PHOTO_UPLOAD_DISABLED",
        "La subida de fotos no está disponible.",
        503,
      );
    }

    const store = createPersistenceStore(config);
    if (store.kind !== "supabase") {
      throw new AppError(
        "SUPABASE_REQUIRED",
        "Photo upload requires DATA_STORE=supabase.",
        503,
      );
    }
    assertSupabaseStore(store);

    const formData = await request.formData();
    const sessionId = formData.get("sessionId");
    const consentPolicyVersion = formData.get("consentPolicyVersion");
    const isOwnImage = formData.get("isOwnImage");
    const image = formData.get("image");

    const parsed = consentSchema.safeParse({
      sessionId,
      consentPolicyVersion,
      isOwnImage,
    });
    if (!parsed.success) {
      throw new AppError(
        "INVALID_BODY",
        "Consentimiento e imagen válidos requeridos.",
        400,
      );
    }

    if (!(image instanceof File)) {
      throw new AppError(
        "INVALID_BODY",
        "Debes enviar una imagen en el campo image.",
        400,
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const result = await uploadPhoto(store.supabase, config, {
      sessionId: parsed.data.sessionId,
      consentPolicyVersion: parsed.data.consentPolicyVersion,
      isOwnImage: true,
      imageBuffer,
      declaredMime: image.type || null,
    });

    return NextResponse.json({
      photoId: result.photoId,
      path: result.path,
      previewUrl: result.previewUrl,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
