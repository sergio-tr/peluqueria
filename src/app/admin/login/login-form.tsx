"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";
import { createBrowserAuthClient } from "@/infrastructure/supabase/browser-client";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/admin";
  const configError = searchParams.get("error") === "auth_not_configured";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    configError ? "El acceso profesional no está configurado." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserAuthClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("Credenciales incorrectas o cuenta no autorizada.");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Comprueba la configuración de Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sage)]">
        Panel profesional
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--color-charcoal)]">
        Iniciar sesión
      </h1>
      <HebraLine className="mt-4" />
      <p className="mt-6 text-[var(--color-charcoal)]/75">
        Accede con la cuenta de staff creada en Supabase Auth.
      </p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-sm border border-[var(--color-charcoal)]/20 bg-[var(--color-ivory)] px-3 py-3 outline-none focus:border-[var(--color-copper)]"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-sm border border-[var(--color-charcoal)]/20 bg-[var(--color-ivory)] px-3 py-3 outline-none focus:border-[var(--color-copper)]"
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
