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

const jsonBodySchema = z.object({
  sessionId: z.string().min(1),
  consentPolicyVersion: z.string().min(1),
  isOwnImage: z.literal(true),
  imageDataUrl: z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i),
});

function bufferFromDataUrl(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new AppError("INVALID_BODY", "Data URL de imagen no válida.", 400);
  }
  return {
    mime: match[1]!.toLowerCase(),
    buffer: Buffer.from(match[2]!, "base64"),
  };
}

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

    const contentType = request.headers.get("content-type") ?? "";
    let sessionId: unknown;
    let consentPolicyVersion: unknown;
    let isOwnImage: unknown;
    let imageBuffer: Buffer;
    let declaredMime: string | null = null;

    if (contentType.includes("application/json")) {
      const json: unknown = await request.json();
      const parsedJson = jsonBodySchema.safeParse(json);
      if (!parsedJson.success) {
        throw new AppError(
          "INVALID_BODY",
          "Consentimiento e imagen válidos requeridos.",
          400,
        );
      }
      sessionId = parsedJson.data.sessionId;
      consentPolicyVersion = parsedJson.data.consentPolicyVersion;
      isOwnImage = true;
      const decoded = bufferFromDataUrl(parsedJson.data.imageDataUrl);
      imageBuffer = decoded.buffer;
      declaredMime = decoded.mime;
    } else {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        throw new AppError(
          "INVALID_BODY",
          "Debes enviar multipart/form-data con el campo image.",
          400,
        );
      }
      sessionId = formData.get("sessionId");
      consentPolicyVersion = formData.get("consentPolicyVersion");
      isOwnImage = formData.get("isOwnImage");
      const image = formData.get("image");
      if (!(image instanceof File)) {
        throw new AppError(
          "INVALID_BODY",
          "Debes enviar una imagen en el campo image.",
          400,
        );
      }
      imageBuffer = Buffer.from(await image.arrayBuffer());
      declaredMime = image.type || null;
    }

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

    const result = await uploadPhoto(store.supabase, config, {
      sessionId: parsed.data.sessionId,
      consentPolicyVersion: parsed.data.consentPolicyVersion,
      isOwnImage: true,
      imageBuffer,
      declaredMime,
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
