-- MuktoKormo initial schema
-- Source: marketplace_platform_spec.pdf -> Database Schema Diagram (7 core tables)
-- Adapted for Supabase Auth: passwords live in auth.users, so users.password_hash is dropped
-- and public.users.id references auth.users.id.

create extension if not exists pgcrypto;

create table public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      varchar(255) not null unique,
  name       varchar(255) not null,
  created_at timestamptz not null default now()
);

create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references public.users (id) on delete cascade,
  company_name varchar(255),
  industry     varchar(255),
  company_bio  text
);

create table public.freelancers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.users (id) on delete cascade,
  title       varchar(255),
  hourly_rate numeric(12, 2) check (hourly_rate is null or hourly_rate >= 0),
  skills      text[] not null default '{}',
  bio         text
);

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients (id) on delete cascade,
  title           varchar(255) not null,
  description     text not null,
  budget_min      numeric(12, 2),
  budget_max      numeric(12, 2),
  status          varchar(32) not null default 'open',
  skills_required text[] not null default '{}',
  created_at      timestamptz not null default now(),
  constraint projects_status_check check (status in ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  constraint projects_budget_check check (budget_min is null or budget_max is null or budget_min <= budget_max)
);

create table public.proposals (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  freelancer_id uuid not null references public.freelancers (id) on delete cascade,
  cover_letter  text not null,
  bid_amount    numeric(12, 2) not null check (bid_amount > 0),
  status        varchar(32) not null default 'pending',
  created_at    timestamptz not null default now(),
  constraint proposals_status_check check (status in ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  constraint proposals_one_per_freelancer unique (project_id, freelancer_id)
);

create table public.contracts (
  id           uuid primary key default gen_random_uuid(),
  proposal_id  uuid not null unique references public.proposals (id) on delete cascade,
  start_date   timestamptz,
  end_date     timestamptz,
  total_amount numeric(12, 2) not null check (total_amount > 0),
  status       varchar(32) not null default 'active',
  constraint contracts_status_check check (status in ('active', 'completed', 'disputed', 'terminated')),
  constraint contracts_dates_check check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts (id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  feedback    text,
  created_at  timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status);
create index proposals_project_id_idx on public.proposals (project_id);
create index proposals_freelancer_id_idx on public.proposals (freelancer_id);
create index contracts_proposal_id_idx on public.contracts (proposal_id);

-- Creates the public.users row automatically after a Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.freelancers enable row level security;
alter table public.projects enable row level security;
alter table public.proposals enable row level security;
alter table public.contracts enable row level security;
alter table public.reviews enable row level security;

create policy users_select_own on public.users
  for select to authenticated
  using (auth.uid() = id);

create policy users_insert_own on public.users
  for insert to authenticated
  with check (auth.uid() = id);

create policy users_update_own on public.users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy clients_select_authenticated on public.clients
  for select to authenticated
  using (true);

create policy clients_insert_own on public.clients
  for insert to authenticated
  with check (user_id = auth.uid());

create policy clients_update_own on public.clients
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy clients_delete_own on public.clients
  for delete to authenticated
  using (user_id = auth.uid());

create policy freelancers_select_authenticated on public.freelancers
  for select to authenticated
  using (true);

create policy freelancers_insert_own on public.freelancers
  for insert to authenticated
  with check (user_id = auth.uid());

create policy freelancers_update_own on public.freelancers
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy freelancers_delete_own on public.freelancers
  for delete to authenticated
  using (user_id = auth.uid());

create policy projects_select_open_or_own on public.projects
  for select to authenticated
  using (
    status <> 'draft'
    or client_id in (select c.id from public.clients c where c.user_id = auth.uid())
  );

create policy projects_insert_own on public.projects
  for insert to authenticated
  with check (client_id in (select c.id from public.clients c where c.user_id = auth.uid()));

create policy projects_update_own on public.projects
  for update to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = auth.uid()))
  with check (client_id in (select c.id from public.clients c where c.user_id = auth.uid()));

create policy projects_delete_own on public.projects
  for delete to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = auth.uid()));

create policy proposals_select_parties on public.proposals
  for select to authenticated
  using (
    freelancer_id in (select f.id from public.freelancers f where f.user_id = auth.uid())
    or project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

create policy proposals_insert_own on public.proposals
  for insert to authenticated
  with check (freelancer_id in (select f.id from public.freelancers f where f.user_id = auth.uid()));

create policy proposals_update_parties on public.proposals
  for update to authenticated
  using (
    freelancer_id in (select f.id from public.freelancers f where f.user_id = auth.uid())
    or project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  )
  with check (
    freelancer_id in (select f.id from public.freelancers f where f.user_id = auth.uid())
    or project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

create policy proposals_delete_own on public.proposals
  for delete to authenticated
  using (freelancer_id in (select f.id from public.freelancers f where f.user_id = auth.uid()));

create policy contracts_select_parties on public.contracts
  for select to authenticated
  using (
    proposal_id in (
      select p.id from public.proposals p
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or proposal_id in (
      select p.id from public.proposals p
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  );

create policy contracts_insert_parties on public.contracts
  for insert to authenticated
  with check (
    proposal_id in (
      select p.id from public.proposals p
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or proposal_id in (
      select p.id from public.proposals p
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  );

create policy contracts_update_parties on public.contracts
  for update to authenticated
  using (
    proposal_id in (
      select p.id from public.proposals p
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or proposal_id in (
      select p.id from public.proposals p
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  )
  with check (
    proposal_id in (
      select p.id from public.proposals p
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or proposal_id in (
      select p.id from public.proposals p
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  );

create policy reviews_select_authenticated on public.reviews
  for select to authenticated
  using (true);

create policy reviews_insert_parties on public.reviews
  for insert to authenticated
  with check (
    contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  );

create policy reviews_update_parties on public.reviews
  for update to authenticated
  using (
    contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  )
  with check (
    contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  );

create policy reviews_delete_parties on public.reviews
  for delete to authenticated
  using (
    contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.projects j on j.id = p.project_id
      join public.clients c on c.id = j.client_id
      where c.user_id = auth.uid()
    )
    or contract_id in (
      select ct.id from public.contracts ct
      join public.proposals p on p.id = ct.proposal_id
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  );
