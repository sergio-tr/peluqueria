import type { SupabaseClient } from "@supabase/supabase-js";

export type WebhookDeliveryInsert = {
  webhookId: string;
  externalPredictionId: string;
  eventStatus?: string;
};

export async function insertWebhookDelivery(
  client: SupabaseClient,
  input: WebhookDeliveryInsert,
): Promise<"inserted" | "duplicate"> {
  const { error } = await client.from("webhook_deliveries").insert({
    webhook_id: input.webhookId,
    external_prediction_id: input.externalPredictionId,
    event_status: input.eventStatus ?? null,
  });

  if (!error) {
    return "inserted";
  }

  if (error.code === "23505") {
    return "duplicate";
  }

  throw error;
}
