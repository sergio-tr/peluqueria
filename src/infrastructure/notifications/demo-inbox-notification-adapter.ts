import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BookingConfirmedNotificationInput,
  NotificationPort,
  ProposalNotificationInput,
} from "@/domain/notifications/notification-port";
import { insertDemoInboxMessage } from "@/infrastructure/persistence/repositories/demo-inbox";

export class DemoInboxNotificationAdapter implements NotificationPort {
  constructor(private readonly client: SupabaseClient) {}

  async sendProposalNotification(input: ProposalNotificationInput): Promise<void> {
    await insertDemoInboxMessage(this.client, {
      id: crypto.randomUUID(),
      salonId: input.salonId,
      bookingRequestId: input.bookingRequestId,
      subject: input.subject,
      bodySummary: input.bodySummary,
      confirmPath: input.confirmPath,
    });
  }

  async sendBookingConfirmedNotification(
    input: BookingConfirmedNotificationInput,
  ): Promise<void> {
    await insertDemoInboxMessage(this.client, {
      id: crypto.randomUUID(),
      salonId: input.salonId,
      bookingRequestId: input.bookingRequestId,
      subject: input.subject,
      bodySummary: input.bodySummary,
      confirmPath: input.confirmPath,
    });
  }
}

export function createDemoInboxNotificationAdapter(
  client: SupabaseClient,
): NotificationPort {
  return new DemoInboxNotificationAdapter(client);
}
