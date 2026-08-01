import { NextResponse } from "next/server";

/**
 * Liveness probe for Netlify preview/production health checks.
 * Public — no secrets or datastore access.
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "peluqueria-nowi" });
}
