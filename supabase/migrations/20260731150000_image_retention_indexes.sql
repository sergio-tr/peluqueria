-- Phase 5: retention purge query indexes (ADR-012 / C-07)

create index if not exists photos_retention_idx
  on public.photos (salon_id, created_at)
  where deleted_at is null;

create index if not exists booking_requests_unconfirmed_retention_idx
  on public.booking_requests (salon_id, created_at)
  where status <> 'CONFIRMED';

create index if not exists booking_requests_confirmed_retention_idx
  on public.booking_requests (salon_id, proposed_ends_at)
  where status = 'CONFIRMED';
