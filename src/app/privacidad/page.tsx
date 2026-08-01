import { SiteHeader } from "@/components/layout/site-header";
import { HebraLine } from "@/components/brand/hebra-line";

export default function PrivacidadPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Privacidad</h1>
        <HebraLine className="mt-4 max-w-xs" />
        <div className="mt-8 space-y-4 text-[var(--color-charcoal)]/80">
          <p>
            Esta demostración trata fotografías solo para generar una vista previa de
            corte y gestionar la solicitud de cita. No usamos las imágenes para entrenar
            modelos.
          </p>
          <p>
            Retención orientativa: borradores 24 horas; solicitudes no confirmadas 7
            días; citas confirmadas 7 días después de la cita. Puedes solicitar el
            borrado al salón.
          </p>
          <p>Versión de política: 2026-07-30.</p>
        </div>
      </main>
    </div>
  );
}
