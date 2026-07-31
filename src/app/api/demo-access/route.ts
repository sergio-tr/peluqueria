import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, toErrorResponse } from "@/domain/errors";
import {
  createDemoSessionToken,
  demoAccessCodeValid,
  demoSession,
} from "@/infrastructure/demo-session";
import {
  getDemoAccessRateLimiter,
} from "@/infrastructure/demo-rate-limit";
import { clientIpFromRequest, hashIp } from "@/infrastructure/ip-hash";

const bodySchema = z.object({
  code: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("INVALID_BODY", "Código requerido.", 400);
    }
    if (!process.env.DEMO_ACCESS_CODE || !process.env.DEMO_SESSION_SECRET) {
      throw new AppError(
        "DEMO_NOT_CONFIGURED",
        "El acceso demo no está configurado.",
        503,
      );
    }

    const ipKey = hashIp(clientIpFromRequest(request));
    const limiter = getDemoAccessRateLimiter();
    const limit = limiter.check(ipKey);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil((limit.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Demasiados intentos. Espera antes de volver a intentar.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec || 1) },
        },
      );
    }

    if (!demoAccessCodeValid(parsed.data.code)) {
      throw new AppError("INVALID_CODE", "Código incorrecto.", 401);
    }

    const token = await createDemoSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: demoSession.cookieName,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: demoSession.maxAgeSeconds,
    });
    return response;
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
