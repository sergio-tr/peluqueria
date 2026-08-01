/** D-08 / ADR-014 — final notification dedupe key after client confirm. */
export function bookingConfirmedNotificationKey(bookingId: string): string {
  return `booking-confirmed:${bookingId}`;
}
