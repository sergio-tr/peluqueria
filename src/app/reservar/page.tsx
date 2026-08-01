import { Suspense } from "react";
import { BookingForm } from "@/components/booking/booking-form";

export default function ReservarPage() {
  return (
    <Suspense fallback={<main className="p-8">Cargando…</main>}>
      <BookingForm />
    </Suspense>
  );
}
