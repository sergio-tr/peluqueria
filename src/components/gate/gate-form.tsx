"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function GateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "Código incorrecto.");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("No se pudo verificar el acceso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sage)]">Acceso demo</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--color-charcoal)]">
        Peluquería Nowi
      </h1>
      <HebraLine className="mt-4" />
      <p className="mt-6 text-[var(--color-charcoal)]/75">
        Introduce el código compartido para entrar en la demostración.
      </p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span>Código de acceso</span>
          <input
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
          {loading ? "Comprobando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
