import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  demoSession,
  verifyDemoSessionToken,
} from "@/infrastructure/demo-session";

const DEMO_PUBLIC_PREFIXES = [
  "/acceso",
  "/api/demo-access",
  "/api/health",
  "/api/webhooks/replicate",
  "/api/cron/expire",
];

const ADMIN_PUBLIC_PREFIXES = [
  "/admin/login",
  "/api/auth/logout",
];

const DEMO_GATED_PREFIXES = ["/probar", "/reservar"];

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  );
}

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (matchesPrefix(pathname, DEMO_PUBLIC_PREFIXES)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isAdminPublic = matchesPrefix(pathname, ADMIN_PUBLIC_PREFIXES);

  if (isAdminRoute && !isAdminPublic) {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { code: "AUTH_NOT_CONFIGURED", message: "Auth no configurado." },
          { status: 503 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "auth_not_configured");
      return NextResponse.redirect(url);
    }

    let response = NextResponse.next({ request });
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { code: "UNAUTHORIZED", message: "No autorizado." },
          { status: 401 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return response;
  }

  if (isAdminPublic) {
    return NextResponse.next();
  }

  const requiresDemoGate =
    pathname === "/" ||
    matchesPrefix(pathname, DEMO_GATED_PREFIXES) ||
    pathname.startsWith("/api/");

  if (!requiresDemoGate) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(demoSession.cookieName)?.value;
  if (await verifyDemoSessionToken(cookie)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { code: "DEMO_ACCESS_REQUIRED", message: "Acceso demo requerido." },
      { status: 401 },
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/acceso";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
