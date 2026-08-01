import { SiteHeader } from "@/components/layout/site-header";
import { HebraLine } from "@/components/brand/hebra-line";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[var(--color-ivory)]">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col px-5 py-16">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-sage)]">
          Demostración
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--color-charcoal)]">
          Peluquería Nowi
        </h1>
        <HebraLine className="mt-4 max-w-xs" />
        <p className="mt-6 max-w-xl text-lg text-[var(--color-charcoal)]/80">
          Prueba un corte con vista previa asistida y solicita cita con el
          profesional. En modo demo, las generaciones se marcan como
          Demostración.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/probar">Probar un corte</Button>
          <Button href="/reservar" variant="secondary">
            Reservar directamente
          </Button>
        </div>
      </main>
    </div>
  );
}
