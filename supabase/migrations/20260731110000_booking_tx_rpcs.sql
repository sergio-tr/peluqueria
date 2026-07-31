-- Phase 2B — booking transactional RPCs + forward-fix exclusion constraint
create extension if not exists btree_gist;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_no_overlap'
      and conrelid = 'public.booking_requests'::regclass
  ) then
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
  end if;
end $$;

create or replace function public.create_booking_request_tx(
  p_id uuid,
  p_salon_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_hairstyle_id uuid,
  p_status public.booking_status,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text,
  p_source_image_path text,
  p_ai_job_id uuid,
  p_requested_starts_at timestamptz,
  p_requested_ends_at timestamptz,
  p_suggested_duration_minutes integer,
  p_hold_expires_at timestamptz,
  p_consent_policy_version text,
  p_from_status public.booking_status,
  p_to_status public.booking_status,
  p_actor_type text,
  p_actor_id text default null,
  p_event_payload jsonb default '{}'::jsonb
)
returns public.booking_requests
language plpgsql
as $$
declare
  v_row public.booking_requests;
begin
  insert into public.booking_requests (
    id,
    salon_id,
    staff_id,
    service_id,
    hairstyle_id,
    status,
    customer_name,
    customer_email,
    customer_phone,
    notes,
    source_image_path,
    ai_job_id,
    requested_starts_at,
    requested_ends_at,
    suggested_duration_minutes,
    hold_expires_at,
    consent_policy_version
  )
  values (
    p_id,
    p_salon_id,
    p_staff_id,
    p_service_id,
    p_hairstyle_id,
    p_status,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_notes,
    p_source_image_path,
    p_ai_job_id,
    p_requested_starts_at,
    p_requested_ends_at,
    p_suggested_duration_minutes,
    p_hold_expires_at,
    p_consent_policy_version
  )
  returning * into v_row;

  insert into public.booking_events (
    salon_id,
    booking_request_id,
    from_status,
    to_status,
    actor_type,
    actor_id,
    payload_json
  )
  values (
    p_salon_id,
    p_id,
    p_from_status,
    p_to_status,
    p_actor_type,
    p_actor_id,
    p_event_payload
  );

  return v_row;
end;
$$;

create or replace function public.transition_booking_request_tx(
  p_salon_id uuid,
  p_booking_id uuid,
  p_expected_from_status public.booking_status,
  p_to_status public.booking_status,
  p_actor_type text,
  p_actor_id text default null,
  p_proposed_starts_at timestamptz default null,
  p_proposed_ends_at timestamptz default null,
  p_final_duration_minutes integer default null,
  p_hold_expires_at timestamptz default null,
  p_barber_comment text default null,
  p_clear_proposed_times boolean default false,
  p_event_payload jsonb default '{}'::jsonb
)
returns public.booking_requests
language plpgsql
as $$
declare
  v_row public.booking_requests;
  v_current public.booking_status;
begin
  select status
  into v_current
  from public.booking_requests
  where id = p_booking_id
    and salon_id = p_salon_id
  for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  if v_current <> p_expected_from_status then
    raise exception 'INVALID_STATE'
      using errcode = 'P0001',
        detail = format('expected %s got %s', p_expected_from_status, v_current);
  end if;

  update public.booking_requests
  set
    status = p_to_status,
    proposed_starts_at = case
      when p_clear_proposed_times then null
      when p_proposed_starts_at is not null then p_proposed_starts_at
      else proposed_starts_at
    end,
    proposed_ends_at = case
      when p_clear_proposed_times then null
      when p_proposed_ends_at is not null then p_proposed_ends_at
      else proposed_ends_at
    end,
    final_duration_minutes = coalesce(p_final_duration_minutes, final_duration_minutes),
    hold_expires_at = coalesce(p_hold_expires_at, hold_expires_at),
    barber_comment = coalesce(p_barber_comment, barber_comment),
    updated_at = now()
  where id = p_booking_id
    and salon_id = p_salon_id
  returning * into v_row;

  insert into public.booking_events (
    salon_id,
    booking_request_id,
    from_status,
    to_status,
    actor_type,
    actor_id,
    payload_json
  )
  values (
    p_salon_id,
    p_booking_id,
    p_expected_from_status,
    p_to_status,
    p_actor_type,
    p_actor_id,
    p_event_payload
  );

  return v_row;
end;
$$;

revoke all on function public.create_booking_request_tx(
  uuid, uuid, uuid, uuid, uuid, public.booking_status,
  text, text, text, text, text, uuid,
  timestamptz, timestamptz, integer, timestamptz, text,
  public.booking_status, public.booking_status, text, text, jsonb
) from public;

revoke all on function public.transition_booking_request_tx(
  uuid, uuid, public.booking_status, public.booking_status,
  text, text, timestamptz, timestamptz, integer, timestamptz,
  text, boolean, jsonb
) from public;

grant execute on function public.create_booking_request_tx(
  uuid, uuid, uuid, uuid, uuid, public.booking_status,
  text, text, text, text, text, uuid,
  timestamptz, timestamptz, integer, timestamptz, text,
  public.booking_status, public.booking_status, text, text, jsonb
) to service_role;

grant execute on function public.transition_booking_request_tx(
  uuid, uuid, public.booking_status, public.booking_status,
  text, text, timestamptz, timestamptz, integer, timestamptz,
  text, boolean, jsonb
) to service_role;
