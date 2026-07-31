"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";

type Service = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  baseMinutes: number;
  requiresTryon: boolean;
};

type Slot = { startsAt: string; endsAt: string };

export function BookingForm() {
  const search = useSearchParams();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const photoId = search.get("photoId") ?? undefined;
  const jobId = search.get("jobId") ?? undefined;
  const hairstyleId = search.get("hairstyleId") ?? undefined;
  const servicioSlug = search.get("servicio");

  useEffect(() => {
    void fetch("/api/services")
      .then((r) => r.json())
      .then((d: { services: Service[] }) => {
        setServices(d.services);
        if (servicioSlug) {
          const s = d.services.find((x) => x.slug === servicioSlug);
          if (s) setServiceId(s.id);
        } else if (jobId) {
          const withTryon = d.services.find((x) => x.requiresTryon);
          if (withTryon) setServiceId(withTryon.id);
        }
      });
  }, [servicioSlug, jobId]);

  const selected = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  useEffect(() => {
    if (!serviceId || !date) return;
    const q = new URLSearchParams({ serviceId, date });
    if (hairstyleId) q.set("hairstyleId", hairstyleId);
    void fetch(`/api/availability?${q}`)
      .then((r) => r.json())
      .then((d: { slots: Slot[]; durationMinutes: number; message?: string }) => {
        setSlots(d.slots ?? []);
        setDuration(d.durationMinutes ?? null);
      });
  }, [serviceId, date, hairstyleId]);

  async function submit() {
    if (!selected || !startsAt || !consent) return;
    if (selected.requiresTryon && (!jobId || !hairstyleId)) {
      setError("Falta la prueba virtual para este servicio.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          hairstyleId,
          photoId,
          jobId,
          startsAt,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          notes,
          consentPolicyVersion: "2026-07-30",
        }),
      });
      const data = (await res.json()) as { bookingId?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? "No se pudo enviar");
      router.push(`/solicitud/${data.bookingId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Reservar</h1>
        <HebraLine className="mt-4 max-w-xs" />
        <p className="mt-4 text-sm text-[var(--color-charcoal)]/70">
          Horarios en Europe/Madrid. La duración sugerida se confirma con el profesional.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          <label className="block text-sm">
            Servicio
            <select
              className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 bg-transparent px-3 py-3"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Selecciona</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {(s.priceCents / 100).toFixed(0)} €
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Día
            <input
              type="date"
              className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 bg-transparent px-3 py-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {duration ? (
            <p className="text-sm text-[var(--color-sage)]">
              Duración sugerida: {duration} min
            </p>
          ) : null}
          <label className="block text-sm">
            Hora
            <select
              className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 bg-transparent px-3 py-3"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            >
              <option value="">Selecciona hueco</option>
              {slots.map((s) => (
                <option key={s.startsAt} value={s.startsAt}>
                  {new Date(s.startsAt).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Madrid",
                  })}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Nombre
            <input
              className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 bg-transparent px-3 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 bg-transparent px-3 py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Teléfono
            <input
              className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 bg-transparent px-3 py-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Comentarios
            <textarea
              className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 bg-transparent px-3 py-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </label>
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Acepto la política de privacidad (2026-07-30).
          </label>
          <Button
            disabled={busy || !consent || !startsAt || !name || !email || !phone}
            onClick={() => void submit()}
          >
            {busy ? "Enviando…" : "Solicitar cita"}
          </Button>
        </div>
      </main>
    </div>
  );
}
