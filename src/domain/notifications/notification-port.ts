/** D-01 / ADR-002 — outbound notification contract (Demo Inbox v1; Resend future). */

export type ProposalNotificationInput = {
  salonId: string;
  bookingRequestId: string;
  subject: string;
  bodySummary: string;
  confirmPath: string;
};

export type BookingConfirmedNotificationInput = {
  salonId: string;
  bookingRequestId: string;
  subject: string;
  bodySummary: string;
  /** Informational link for demo inbox (e.g. booking summary). */
  confirmPath: string;
};

export interface NotificationPort {
  sendProposalNotification(input: ProposalNotificationInput): Promise<void>;
  sendBookingConfirmedNotification(
    input: BookingConfirmedNotificationInput,
  ): Promise<void>;
}

export const PROPOSAL_INBOX_SUBJECT = "Confirma tu cita en Peluquería Nowi";
export const BOOKING_CONFIRMED_INBOX_SUBJECT =
  "Tu cita en Peluquería Nowi está confirmada";

export function buildProposalBodySummary(durationMinutes: number): string {
  return `Propuesta lista. Duración ${durationMinutes} min.`;
}

export function buildBookingConfirmedBodySummary(
  startsAt: Date,
  durationMinutes: number,
): string {
  const when = startsAt.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `Cita confirmada para el ${when} (${durationMinutes} min).`;
}
