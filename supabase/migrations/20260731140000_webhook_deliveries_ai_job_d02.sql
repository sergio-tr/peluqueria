-- Phase 3B: webhook delivery dedupe + D-02 ai_jobs metadata

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id text not null,
  external_prediction_id text not null,
  event_status text,
  received_at timestamptz not null default now(),
  unique (webhook_id)
);

create index webhook_deliveries_prediction_idx
  on public.webhook_deliveries (external_prediction_id);

alter table public.ai_jobs
  add column if not exists model_owner text,
  add column if not exists model_name text,
  add column if not exists requested_version text,
  add column if not exists asset_version text,
  add column if not exists latency_ms integer,
  add column if not exists pending_result_url text;

comment on column public.ai_jobs.pending_result_url is
  'Server-side staging URL from Replicate until Phase 3C copies to Storage. Never expose to clients.';

alter table public.webhook_deliveries enable row level security;
