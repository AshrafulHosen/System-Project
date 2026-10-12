
create extension if not exists pgcrypto;


alter table public.clients     add column if not exists display_name varchar(255);
alter table public.freelancers add column if not exists display_name varchar(255);


create or replace function public.set_profile_display_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.display_name is null then
    select u.name into new.display_name from public.users u where u.id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists clients_set_display_name on public.clients;
create trigger clients_set_display_name
  before insert or update of user_id on public.clients
  for each row execute function public.set_profile_display_name();

drop trigger if exists freelancers_set_display_name on public.freelancers;
create trigger freelancers_set_display_name
  before insert or update of user_id on public.freelancers
  for each row execute function public.set_profile_display_name();

-- Keep names in sync if the user later changes their name.
create or replace function public.sync_user_name_to_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clients     set display_name = new.name where user_id = new.id;
  update public.freelancers set display_name = new.name where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists users_sync_name on public.users;
create trigger users_sync_name
  after update of name on public.users
  for each row execute function public.sync_user_name_to_profiles();

-- Backfill existing rows.
update public.clients c
  set display_name = u.name
  from public.users u
  where u.id = c.user_id and c.display_name is null;

update public.freelancers f
  set display_name = u.name
  from public.users u
  where u.id = f.user_id and f.display_name is null;


alter table public.projects
  add column if not exists proposals_count integer not null default 0;

create or replace function public.sync_project_proposals_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.project_id, old.project_id);
  if target is not null then
    update public.projects p
      set proposals_count = (
        select count(*) from public.proposals pr
        where pr.project_id = target and pr.status <> 'withdrawn'
      )
      where p.id = target;
  end if;
  return null;
end;
$$;

drop trigger if exists proposals_sync_count on public.proposals;
create trigger proposals_sync_count
  after insert or delete or update of status on public.proposals
  for each row execute function public.sync_project_proposals_count();

-- Backfill existing rows.
update public.projects p
  set proposals_count = (
    select count(*) from public.proposals pr
    where pr.project_id = p.id and pr.status <> 'withdrawn'
  );


drop policy if exists projects_select_public on public.projects;
create policy projects_select_public on public.projects
  for select to anon
  using (status <> 'draft');

drop policy if exists clients_select_public on public.clients;
create policy clients_select_public on public.clients
  for select to anon using (true);

drop policy if exists freelancers_select_public on public.freelancers;
create policy freelancers_select_public on public.freelancers
  for select to anon using (true);
