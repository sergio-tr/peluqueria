-- Phase 2C: durable idempotency keys (confirm + notification prep for Phase 4)

create table if not exists public.idempotency_keys (
  idempotency_key text primary key,
  salon_id uuid not null references public.salons(id) on delete cascade,
  scope text not null,
  resource_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idempotency_keys_salon_scope_idx
  on public.idempotency_keys (salon_id, scope);

alter table public.idempotency_keys enable row level security;
