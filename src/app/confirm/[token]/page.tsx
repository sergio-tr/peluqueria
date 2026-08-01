"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";

export default function ConfirmPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [summary, setSummary] = useState<{
    serviceName?: string;
    startsAtLocal?: string;
    durationMinutes?: number;
    customerName?: string;
    message?: string;
  } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/confirm/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message ?? "Error");
        setSummary(data);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  async function act(action: "confirm" | "decline") {
    setError(null);
    const res = await fetch("/api/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });
    const data = (await res.json()) as { status?: string; message?: string };
    if (!res.ok) {
      setError(data.message ?? "Error");
      return;
    }
    setDone(data.status ?? action);
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Confirmación de cita
        </h1>
        <HebraLine className="mt-4 max-w-xs" />
        {error ? (
          <p className="mt-6 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {done ? (
          <p className="mt-6 text-lg">
            Estado final: <strong>{done}</strong>
          </p>
        ) : summary ? (
          <div className="mt-6 space-y-3">
            <p>Hola {summary.customerName}</p>
            <p>
              {summary.serviceName} · {summary.startsAtLocal} (Madrid) ·{" "}
              {summary.durationMinutes} min
            </p>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => void act("confirm")}>Confirmar cita</Button>
              <Button variant="secondary" onClick={() => void act("decline")}>
                Rechazar
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-6">Cargando…</p>
        )}
      </main>
    </div>
  );
}
