-- MuktoKormo admin role
-- Administrators are platform staff. They are deliberately NOT stored in
-- public.clients or public.freelancers, so an admin's user "type" is none.
-- Admin rows are provisioned manually (SQL / service role) - never via signup.

create table if not exists public.admins (
  user_id    uuid primary key references public.users (id) on delete cascade,
  note       varchar(255),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Helper used by RLS policies. SECURITY DEFINER avoids recursive RLS lookups
-- on public.admins when policies reference this function.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = uid);
$$;

-- An admin can read the roster of admins (needed for the admin dashboard).
-- Non-admins cannot read any row, so resolveUserRole() simply comes back empty.
drop policy if exists admins_select_admin on public.admins;
create policy admins_select_admin on public.admins
  for select to authenticated
  using (public.is_admin(auth.uid()));

-- No insert/update/delete policies: admins are provisioned out-of-band.

-- Admin read access to every platform table. RLS policies are permissive, so
-- these add to the existing owner policies rather than replacing them.
drop policy if exists users_select_admin on public.users;
create policy users_select_admin on public.users
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists clients_select_admin on public.clients;
create policy clients_select_admin on public.clients
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists freelancers_select_admin on public.freelancers;
create policy freelancers_select_admin on public.freelancers
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists projects_select_admin on public.projects;
create policy projects_select_admin on public.projects
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists proposals_select_admin on public.proposals;
create policy proposals_select_admin on public.proposals
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists contracts_select_admin on public.contracts;
create policy contracts_select_admin on public.contracts
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists reviews_select_admin on public.reviews;
create policy reviews_select_admin on public.reviews
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists proposal_milestones_select_admin on public.proposal_milestones;
create policy proposal_milestones_select_admin on public.proposal_milestones
  for select to authenticated using (public.is_admin(auth.uid()));

-- Provision an admin after they have signed up. Replace the email below:
--
--   insert into public.admins (user_id, note)
--   select id, 'Founding admin' from public.users where email = 'admin@muktokormo.com'
--   on conflict (user_id) do nothing;
