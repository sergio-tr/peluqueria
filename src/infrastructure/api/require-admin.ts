import { AppError } from "@/domain/errors";

/**
 * Temporary admin gate until Phase 2A (Supabase Auth).
 * Fails closed when ADMIN_DEMO_KEY is unset.
 */
export function requireAdmin(request: Request): void {
  const expected = process.env.ADMIN_DEMO_KEY;
  const key = request.headers.get("x-admin-key");
  if (!expected || !key || key !== expected) {
    throw new AppError("UNAUTHORIZED", "No autorizado.", 401);
  }
}
