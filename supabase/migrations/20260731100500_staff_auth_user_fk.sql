-- Forward-only: enforce staff.auth_user_id references Supabase auth.users
alter table public.staff
  drop constraint if exists staff_auth_user_id_fkey;

alter table public.staff
  add constraint staff_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users (id)
  on delete set null;

comment on column public.staff.auth_user_id is
  'Supabase Auth user linked to this staff row; required for admin API access.';
