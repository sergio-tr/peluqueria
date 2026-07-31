import { AppError } from "@/domain/errors";
import { createServiceClient } from "@/infrastructure/supabase/client";
import { createRequestAuthClient } from "@/infrastructure/supabase/server-auth-client";

export type AdminSession = {
  userId: string;
  staffId: string;
};

/**
 * Verify Supabase Auth session and active staff linkage.
 * Replaces the legacy ADMIN_DEMO_KEY header check (Phase 2A).
 */
export async function requireAdmin(request: Request): Promise<AdminSession> {
  const authHeader = request.headers.get("authorization");
  let userId: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError("UNAUTHORIZED", "No autorizado.", 401);
    }
    const supabase = createRequestAuthClient(request);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new AppError("UNAUTHORIZED", "No autorizado.", 401);
    }
    userId = data.user.id;
  } else {
    const supabase = createRequestAuthClient(request);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new AppError("UNAUTHORIZED", "No autorizado.", 401);
    }
    userId = data.user.id;
  }

  const service = createServiceClient();
  const { data: staff, error: staffError } = await service
    .from("staff")
    .select("id")
    .eq("auth_user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (staffError || !staff) {
    throw new AppError(
      "FORBIDDEN",
      "Tu cuenta no está vinculada a un perfil de staff activo.",
      403,
    );
  }

  return { userId, staffId: staff.id };
}
