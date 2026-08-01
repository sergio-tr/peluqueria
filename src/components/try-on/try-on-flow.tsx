"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";

type Hairstyle = {
  id: string;
  name: string;
  catalogImageUrl: string;
};

type Step = "photo" | "consent" | "style" | "generate" | "compare";

function getSessionId() {
  const key = "nowi_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function TryOnFlow() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<Step>("photo");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [ownImage, setOwnImage] = useState(false);
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const policyVersion = "2026-07-30";

  useEffect(() => {
    void fetch("/api/hairstyles")
      .then(async (r) => {
        const d = (await r.json()) as {
          hairstyles?: Hairstyle[];
          message?: string;
        };
        if (!r.ok) {
          throw new Error(d.message ?? "No se pudo cargar el catálogo.");
        }
        setHairstyles(d.hairstyles ?? []);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "No se pudo cargar el catálogo.");
      });
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  async function startCamera() {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
    } catch {
      setError("No se pudo acceder a la cámara. Puedes subir una imagen.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setLocalImage(canvas.toDataURL("image/jpeg", 0.92));
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Formato no válido.");
      return;
    }
    if (file.size > 4_000_000) {
      setError("Máximo 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLocalImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function uploadWithConsent() {
    if (!localImage || !consent || !ownImage) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await (await fetch(localImage)).blob();
      const form = new FormData();
      form.set("sessionId", getSessionId());
      form.set("consentPolicyVersion", policyVersion);
      form.set("isOwnImage", "true");
      form.set("image", blob, "capture.jpg");

      const res = await fetch("/api/photos", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { photoId?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? "Error al subir");
      setPhotoId(data.photoId!);
      setStep("style");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  async function startGeneration() {
    if (!photoId || !selectedStyle) return;
    setBusy(true);
    setError(null);
    setStep("generate");
    try {
      const res = await fetch("/api/ai/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          photoId,
          hairstyleId: selectedStyle,
        }),
      });
      const data = (await res.json()) as {
        jobId?: string;
        isMock?: boolean;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "No se pudo generar");
      setJobId(data.jobId!);
      setIsMock(Boolean(data.isMock));
      await pollJob(data.jobId!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de generación");
      setStep("style");
    } finally {
      setBusy(false);
    }
  }

  async function pollJob(id: string) {
    let delay = 800;
    // Local GPU inpaint can take 30–90s on first runs.
    for (let i = 0; i < 90; i += 1) {
      const res = await fetch(`/api/ai/jobs/${id}`);
      const data = (await res.json()) as {
        status: string;
        resultPreviewUrl?: string;
        isMock?: boolean;
        errorCode?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Error de estado");
      if (data.status === "SUCCEEDED") {
        setResultUrl(data.resultPreviewUrl ?? null);
        setIsMock(Boolean(data.isMock));
        setStep("compare");
        return;
      }
      if (data.status === "FAILED") {
        throw new Error("La generación ha fallado.");
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.25, 3000);
    }
    throw new Error("Tiempo de espera agotado.");
  }

  const canUpload = useMemo(
    () => Boolean(localImage && consent && ownImage),
    [localImage, consent, ownImage],
  );

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sage)]">
          Prueba virtual
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
          {step === "photo" && "Tu fotografía"}
          {step === "consent" && "Privacidad"}
          {step === "style" && "Elige un corte"}
          {step === "generate" && "Generando vista previa"}
          {step === "compare" && "Compara el resultado"}
        </h1>
        <HebraLine className="mt-4 max-w-xs" />

        {error ? (
          <p className="mt-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        {step === "photo" ? (
          <div className="mt-8 space-y-4">
            <div className="overflow-hidden rounded-sm bg-[var(--color-charcoal)]/90">
              {localImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={localImage} alt="Vista previa local" className="w-full" />
              ) : (
                <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline />
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void startCamera()}>Abrir cámara</Button>
              <Button onClick={capture} variant="secondary" disabled={!stream}>
                Capturar
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-sm border border-[var(--color-charcoal)]/20 px-5 py-3 text-sm">
                Subir imagen
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <Button
              disabled={!localImage}
              onClick={() => setStep("consent")}
            >
              Continuar
            </Button>
          </div>
        ) : null}

        {step === "consent" ? (
          <div className="mt-8 space-y-4">
            <p className="text-[var(--color-charcoal)]/80">
              Usaremos tu foto solo para generar una vista previa y gestionar la
              cita. No entrenamos modelos con ella. Política {policyVersion}.
            </p>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={ownImage}
                onChange={(e) => setOwnImage(e.target.checked)}
              />
              Declaro que la imagen es mía o tengo derecho a usarla.
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Acepto el tratamiento de la imagen y la política de privacidad.
            </label>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("photo")}>
                Atrás
              </Button>
              <Button disabled={!canUpload || busy} onClick={() => void uploadWithConsent()}>
                {busy ? "Subiendo…" : "Subir y continuar"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "style" ? (
          <div className="mt-8">
            {hairstyles.length === 0 ? (
              <p className="text-sm text-[var(--color-charcoal)]/75">
                No hay cortes disponibles ahora mismo. Comprueba el acceso demo
                y recarga la página.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {hairstyles.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedStyle(h.id)}
                  className={`overflow-hidden rounded-sm border text-left transition ${
                    selectedStyle === h.id
                      ? "border-[var(--color-copper)]"
                      : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={h.catalogImageUrl}
                    alt=""
                    aria-hidden
                    className="aspect-[4/5] w-full object-cover bg-[var(--color-ivory-deep)]"
                  />
                  <span className="block p-2 text-sm">{h.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <Button disabled={!selectedStyle || busy} onClick={() => void startGeneration()}>
                Generar vista previa
              </Button>
            </div>
          </div>
        ) : null}

        {step === "generate" ? (
          <div className="mt-10">
            <p className="text-[var(--color-charcoal)]/75">
              Estamos preparando tu vista previa. Esto puede tardar unos segundos.
            </p>
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-[var(--color-ivory-deep)]">
              <div className="h-full w-1/2 animate-pulse bg-[var(--color-copper)]" />
            </div>
          </div>
        ) : null}

        {step === "compare" && localImage && resultUrl ? (
          <div className="mt-8 space-y-4">
            {isMock ? (
              <p className="rounded-sm bg-[var(--color-sage)]/20 px-3 py-2 text-sm font-medium">
                Demostración local — collage tu foto + corte elegido (sin
                Replicate). Para IA real del pelo: crédito en Replicate y{" "}
                <code className="text-xs">AI_PROVIDER=replicate-hairclip</code>.
              </p>
            ) : null}
            <div className="grid gap-4">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Resultado de la demostración"
                  className="w-full rounded-sm"
                />
                <figcaption className="mt-2 text-sm">
                  {isMock
                    ? "Vista previa demo (foto | corte)"
                    : "Vista previa IA"}
                </figcaption>
              </figure>
              {!isMock ? (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localImage}
                    alt="Original"
                    className="w-full rounded-sm"
                  />
                  <figcaption className="mt-2 text-sm">Original</figcaption>
                </figure>
              ) : null}
            </div>
            <Button
              onClick={() => {
                const q = new URLSearchParams({
                  photoId: photoId ?? "",
                  jobId: jobId ?? "",
                  hairstyleId: selectedStyle ?? "",
                });
                router.push(`/reservar?${q.toString()}`);
              }}
            >
              Adjuntar y reservar
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
