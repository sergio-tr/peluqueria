"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";

type BookingRow = {
  id: string;
  status: string;
  customerName: string;
  serviceName?: string;
  requestedStartsAt: string;
  proposedStartsAt?: string;
};

type InboxMsg = {
  id: string;
  subject: string;
  bodySummary: string;
  confirmPath: string;
  bookingId: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [inbox, setInbox] = useState<InboxMsg[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    booking: {
      id: string;
      status: string;
      suggestedDurationMinutes: number;
      finalDurationMinutes?: number;
      requestedStartsAt: string;
      barberComment?: string;
    };
    service?: { name: string };
    hairstyle?: { name: string; catalogImagePath: string };
    sourcePreviewUrl?: string;
    resultPreviewUrl?: string;
    resultIsMock?: boolean;
  } | null>(null);
  const [duration, setDuration] = useState(60);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleAuthError(res: Response): Promise<boolean> {
    if (res.status === 401 || res.status === 403) {
      router.replace("/admin/login?next=/admin");
      return true;
    }
    return false;
  }

  async function load() {
    const [bRes, iRes] = await Promise.all([
      fetch("/api/admin/booking-requests"),
      fetch("/api/admin/demo-inbox"),
    ]);
    if (await handleAuthError(bRes) || await handleAuthError(iRes)) return;
    const [b, i] = await Promise.all([bRes.json(), iRes.json()]);
    setBookings(b.bookings ?? []);
    setInbox(i.messages ?? []);
  }

  async function openDetail(id: string) {
    setSelected(id);
    const res = await fetch(`/api/admin/booking-requests/${id}`);
    if (await handleAuthError(res)) return;
    const data = await res.json();
    setDetail(data);
    setDuration(
      data.booking.finalDurationMinutes ??
        data.booking.suggestedDurationMinutes,
    );
  }

  async function transition(action: "approve" | "propose" | "reject") {
    if (!selected) return;
    setMessage(null);
    const res = await fetch(`/api/admin/booking-requests/${selected}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, durationMinutes: duration, comment }),
    });
    if (await handleAuthError(res)) return;
    const data = (await res.json()) as { message?: string; confirmPath?: string };
    if (!res.ok) {
      setMessage(data.message ?? "Error");
      return;
    }
    setMessage(
      action === "reject"
        ? "Solicitud rechazada."
        : `Propuesta enviada a Demo Inbox${data.confirmPath ? `: ${data.confirmPath}` : ""}`,
    );
    await load();
    await openDetail(selected);
  }

  async function simulateExpire() {
    const res = await fetch("/api/admin/expire-due", { method: "POST" });
    if (await handleAuthError(res)) return;
    await load();
    setMessage("Expiración simulada ejecutada.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_1.1fr]">
        <section>
          <h1 className="font-[family-name:var(--font-display)] text-4xl">
            Panel profesional
          </h1>
          <HebraLine className="mt-4 max-w-xs" />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => void load()}>Cargar solicitudes</Button>
            <Button variant="secondary" onClick={() => void simulateExpire()}>
              Simular expiración
            </Button>
            <Button variant="ghost" onClick={() => void logout()}>
              Cerrar sesión
            </Button>
          </div>
          {message ? <p className="mt-3 text-sm text-[var(--color-sage)]">{message}</p> : null}
          <ul className="mt-6 space-y-2">
            {bookings.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => void openDetail(b.id)}
                  className={`w-full rounded-sm border px-4 py-3 text-left ${
                    selected === b.id
                      ? "border-[var(--color-copper)]"
                      : "border-[var(--color-charcoal)]/10"
                  }`}
                >
                  <div className="font-medium">{b.customerName}</div>
                  <div className="text-sm text-[var(--color-charcoal)]/70">
                    {b.serviceName} · {b.status}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl">
            Demo Inbox
          </h2>
          <ul className="mt-4 space-y-3">
            {inbox.map((m) => (
              <li key={m.id} className="rounded-sm border border-[var(--color-charcoal)]/10 p-4">
                <div className="font-medium">{m.subject}</div>
                <p className="text-sm text-[var(--color-charcoal)]/70">{m.bodySummary}</p>
                <Link
                  className="mt-2 inline-block text-sm text-[var(--color-copper)]"
                  href={m.confirmPath}
                >
                  Abrir enlace de confirmación
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          {detail ? (
            <div className="space-y-4">
              <h2 className="font-[family-name:var(--font-display)] text-3xl">
                {detail.service?.name}
              </h2>
              <p className="text-sm">{detail.booking.status}</p>
              {detail.resultIsMock ? (
                <p className="rounded-sm bg-[var(--color-sage)]/20 px-3 py-2 text-sm font-medium">
                  Demostración — resultado mock
                </p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                {detail.sourcePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.sourcePreviewUrl} alt="Original" className="rounded-sm" />
                ) : null}
                {detail.resultPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.resultPreviewUrl} alt="Resultado" className="rounded-sm" />
                ) : null}
              </div>
              {detail.hairstyle ? (
                <p className="text-sm">Corte: {detail.hairstyle.name}</p>
              ) : null}
              <label className="block text-sm">
                Duración (min)
                <input
                  type="number"
                  className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 px-3 py-2"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </label>
              <label className="block text-sm">
                Comentario
                <textarea
                  className="mt-1 w-full rounded-sm border border-[var(--color-charcoal)]/20 px-3 py-2"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void transition("approve")}>Aprobar</Button>
                <Button variant="secondary" onClick={() => void transition("propose")}>
                  Proponer
                </Button>
                <Button variant="ghost" onClick={() => void transition("reject")}>
                  Rechazar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[var(--color-charcoal)]/60">
              Selecciona una solicitud para revisarla.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
