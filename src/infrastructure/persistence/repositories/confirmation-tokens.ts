import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ConfirmationTokenRow = {
  id: string;
  booking_request_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type ConfirmationToken = {
  id: string;
  bookingRequestId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
};

export function hashConfirmationToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function mapConfirmationToken(row: ConfirmationTokenRow): ConfirmationToken {
  return {
    id: row.id,
    bookingRequestId: row.booking_request_id,
    tokenHash: row.token_hash,
    expiresAt: new Date(row.expires_at),
    usedAt: row.used_at ? new Date(row.used_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function insertConfirmationToken(
  client: SupabaseClient,
  input: {
    id: string;
    bookingRequestId: string;
    tokenHash: string;
    expiresAt: Date;
  },
): Promise<ConfirmationToken> {
  const { data, error } = await client
    .from("confirmation_tokens")
    .insert({
      id: input.id,
      booking_request_id: input.bookingRequestId,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt.toISOString(),
    })
    .select("id,booking_request_id,token_hash,expires_at,used_at,created_at")
    .single();
  if (error) throw error;
  return mapConfirmationToken(data as ConfirmationTokenRow);
}

export async function findTokenByPlaintext(
  client: SupabaseClient,
  plaintext: string,
): Promise<ConfirmationToken | null> {
  const tokenHash = hashConfirmationToken(plaintext);
  const { data, error } = await client
    .from("confirmation_tokens")
    .select("id,booking_request_id,token_hash,expires_at,used_at,created_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw error;
  return data ? mapConfirmationToken(data as ConfirmationTokenRow) : null;
}

export async function markTokenUsed(
  client: SupabaseClient,
  tokenId: string,
  usedAt = new Date(),
): Promise<void> {
  const { error } = await client
    .from("confirmation_tokens")
    .update({ used_at: usedAt.toISOString() })
    .eq("id", tokenId)
    .is("used_at", null);
  if (error) throw error;
}

export async function invalidateTokensForBooking(
  client: SupabaseClient,
  bookingRequestId: string,
  usedAt = new Date(),
): Promise<void> {
  const { error } = await client
    .from("confirmation_tokens")
    .update({ used_at: usedAt.toISOString() })
    .eq("booking_request_id", bookingRequestId)
    .is("used_at", null);
  if (error) throw error;
}
