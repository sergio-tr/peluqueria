import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseAuthEnv } from "@/infrastructure/supabase/auth-env";

/** Server Supabase client bound to Next.js cookie store (App Router). */
export async function createServerAuthClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseAuthEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Route handlers may be read-only; session refresh happens in middleware.
        }
      },
    },
  });
}

/** Read-only Supabase client from an incoming Request (API route handlers). */
export function createRequestAuthClient(request: Request): SupabaseClient {
  const { url, anonKey } = getSupabaseAuthEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        const header = request.headers.get("cookie") ?? "";
        if (!header) return [];
        return header.split(";").flatMap((part) => {
          const trimmed = part.trim();
          const eq = trimmed.indexOf("=");
          if (eq <= 0) return [];
          return [
            {
              name: trimmed.slice(0, eq),
              value: trimmed.slice(eq + 1),
            },
          ];
        });
      },
      setAll() {
        // Read-only verification in route handlers.
      },
    },
  });
}
