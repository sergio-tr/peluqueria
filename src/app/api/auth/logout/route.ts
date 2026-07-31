import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/infrastructure/supabase/server-auth-client";

export async function POST() {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
