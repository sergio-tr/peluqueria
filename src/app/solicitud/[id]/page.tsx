import { SiteHeader } from "@/components/layout/site-header";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }> };

export default async function SolicitudPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Solicitud enviada
        </h1>
        <HebraLine className="mt-4 max-w-xs" />
        <p className="mt-6 text-[var(--color-charcoal)]/80">
          Tu horario todavía debe ser revisado por el profesional. Te
          propondremos una confirmación desde la bandeja demo del panel.
        </p>
        <p className="mt-3 text-sm text-[var(--color-charcoal)]/50">Ref: {id}</p>
        <div className="mt-8 flex gap-3">
          <Button href="/">Volver al inicio</Button>
          <Button href="/admin" variant="secondary">
            Panel profesional
          </Button>
        </div>
      </main>
    </div>
  );
}
