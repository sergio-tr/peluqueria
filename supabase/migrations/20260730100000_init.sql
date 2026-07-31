-- Peluquería Nowi — initial schema
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create type public.booking_status as enum (
  'DRAFT',
  'AI_PROCESSING',
  'READY_TO_BOOK',
  'PENDING_BARBER_REVIEW',
  'PENDING_CUSTOMER_CONFIRMATION',
  'CONFIRMED',
  'DECLINED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED'
);

create type public.ai_job_status as enum (
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED'
);

create type public.hairstyle_complexity as enum (
  'low',
  'medium',
  'high'
);

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Europe/Madrid',
  address_json jsonb not null default '{}'::jsonb,
  phone text,
  instagram text,
  created_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  display_name text not null,
  auth_user_id uuid unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  slug text not null,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  base_minutes integer not null check (base_minutes > 0),
  requires_tryon boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  unique (salon_id, slug)
);

create table public.hairstyles (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  slug text not null,
  name text not null,
  catalog_image_path text not null,
  ai_reference_image_path text not null,
  source_url text,
  source_author text,
  source_license text,
  license_checked_at date,
  prompt_modifier text not null default '',
  complexity public.hairstyle_complexity not null default 'medium',
  extra_minutes integer not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  unique (salon_id, slug)
);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  session_id text not null,
  status public.ai_job_status not null default 'QUEUED',
  provider text not null,
  model text not null,
  external_prediction_id text unique,
  reported_model_version text,
  prompt_version text not null,
  input_parameters_json jsonb not null default '{}'::jsonb,
  estimated_cost_usd numeric(10,4),
  error_code text,
  source_image_path text not null,
  reference_image_path text not null,
  result_image_path text,
  consent_policy_version text not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  service_id uuid not null references public.services(id),
  hairstyle_id uuid references public.hairstyles(id),
  status public.booking_status not null default 'DRAFT',
  customer_name text,
  customer_email text,
  customer_phone text,
  notes text,
  source_image_path text,
  result_image_path text,
  requested_starts_at timestamptz,
  requested_ends_at timestamptz,
  proposed_starts_at timestamptz,
  proposed_ends_at timestamptz,
  suggested_duration_minutes integer,
  final_duration_minutes integer,
  hold_expires_at timestamptz,
  consent_policy_version text,
  ai_job_id uuid references public.ai_jobs(id),
  barber_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  block_range tstzrange
    generated always as (
      case
        when proposed_starts_at is not null and proposed_ends_at is not null
          then tstzrange(proposed_starts_at, proposed_ends_at, '[)')
        when requested_starts_at is not null and requested_ends_at is not null
          then tstzrange(requested_starts_at, requested_ends_at, '[)')
        else null
      end
    ) stored
);

alter table public.booking_requests
  add constraint booking_no_overlap
  exclude using gist (
    staff_id with =,
    block_range with &&
  )
  where (
    status in (
      'PENDING_BARBER_REVIEW',
      'PENDING_CUSTOMER_CONFIRMATION',
      'CONFIRMED'
    )
    and block_range is not null
  );

create table public.confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.demo_inbox_messages (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  subject text not null,
  body_summary text not null,
  confirm_path text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_local time not null,
  end_local time not null,
  active boolean not null default true,
  check (start_local < end_local)
);

create table public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (starts_at < ends_at)
);

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  actor_type text not null,
  actor_id text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_usage_counters (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  period_type text not null check (period_type in ('day', 'month', 'session')),
  period_key text not null,
  ip_hash text,
  session_id text,
  count integer not null default 0 check (count >= 0)
);

create unique index ai_usage_counters_uniq
  on public.ai_usage_counters (salon_id, period_type, period_key, coalesce(ip_hash, ''), coalesce(session_id, ''));

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  session_id text not null,
  storage_path text not null,
  consent_policy_version text not null,
  is_own_image boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index booking_requests_status_idx on public.booking_requests (salon_id, status);
create index ai_jobs_external_idx on public.ai_jobs (external_prediction_id);
create index confirmation_tokens_booking_idx on public.confirmation_tokens (booking_request_id);

alter table public.salons enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.hairstyles enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.booking_requests enable row level security;
alter table public.confirmation_tokens enable row level security;
alter table public.demo_inbox_messages enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blocked_periods enable row level security;
alter table public.booking_events enable row level security;
alter table public.ai_usage_counters enable row level security;
alter table public.photos enable row level security;

create policy services_public_read on public.services
  for select to anon, authenticated
  using (active = true);

create policy hairstyles_public_read on public.hairstyles
  for select to anon, authenticated
  using (active = true);

create policy salons_public_read on public.salons
  for select to anon, authenticated
  using (true);
