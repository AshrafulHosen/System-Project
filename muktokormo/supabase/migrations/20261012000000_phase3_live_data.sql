
create extension if not exists pgcrypto;
-- projects -------------------------------------------------------------------
alter table public.projects
  add column if not exists title_bn       varchar(255),
  add column if not exists description_bn text,
  add column if not exists category       varchar(120),
  add column if not exists job_type       varchar(32)  not null default 'Fixed Price'
    check (job_type in ('Fixed Price', 'Milestone Based')),
  add column if not exists experience_level varchar(32)
    check (experience_level is null or experience_level in ('Entry Level', 'Intermediate', 'Expert')),
  add column if not exists timeline_days  integer
    check (timeline_days is null or timeline_days > 0),
  add column if not exists budget_bdt     numeric(12, 2)
    check (budget_bdt is null or budget_bdt >= 0),
  add column if not exists completion_pct integer not null default 100
    check (completion_pct between 0 and 100),
  add column if not exists updated_at     timestamptz not null default now();

-- allow the extra lifecycle states the UI uses
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check
  check (status in ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'archived', 'pending_review', 'expired'));

create index if not exists projects_category_idx on public.projects (category);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

-- proposals ------------------------------------------------------------------
alter table public.proposals
  add column if not exists delivery_days  integer
    check (delivery_days is null or delivery_days > 0),
  add column if not exists bidding_type   varchar(16) not null default 'PROJECT'
    check (bidding_type in ('PROJECT', 'MILESTONES')),
  add column if not exists platform_fee   numeric(12, 2)
    check (platform_fee is null or platform_fee >= 0),
  add column if not exists net_earned     numeric(12, 2)
    check (net_earned is null or net_earned >= 0),
  add column if not exists payout_method  varchar(16)
    check (payout_method is null or payout_method in ('BKASH', 'NAGAD', 'ROCKET', 'BANK')),
  add column if not exists payout_account varchar(64),
  add column if not exists portfolio_links text[] not null default '{}',
  add column if not exists updated_at     timestamptz not null default now();

-- freelancers ----------------------------------------------------------------
alter table public.freelancers
  add column if not exists location        varchar(255),
  add column if not exists avatar_url      text,
  add column if not exists rating          numeric(3, 2) not null default 0
    check (rating between 0 and 5),
  add column if not exists reviews_count   integer not null default 0,
  add column if not exists earned_bdt      numeric(12, 2) not null default 0,
  add column if not exists success_rate    integer not null default 0
    check (success_rate between 0 and 100),
  add column if not exists is_nid_verified boolean not null default false,
  add column if not exists available       boolean not null default true,
  add column if not exists updated_at      timestamptz not null default now();

-- clients --------------------------------------------------------------------
alter table public.clients
  add column if not exists location      varchar(255),
  add column if not exists avatar_url    text,
  add column if not exists rating        numeric(3, 2) not null default 0
    check (rating between 0 and 5),
  add column if not exists reviews_count integer not null default 0,
  add column if not exists is_verified   boolean not null default false,
  add column if not exists updated_at    timestamptz not null default now();


-- proposed milestone breakdown attached to a proposal (JobBid.milestones) ----
create table if not exists public.proposal_milestones (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid not null references public.proposals (id) on delete cascade,
  sort_order    integer not null default 1,
  title         varchar(255) not null,
  amount_bdt    numeric(12, 2) not null check (amount_bdt > 0),
  delivery_days integer check (delivery_days is null or delivery_days > 0),
  created_at    timestamptz not null default now()
);
create index if not exists proposal_milestones_proposal_id_idx on public.proposal_milestones (proposal_id);

-- saved talent bookmarks -----------------------------------------------------
create table if not exists public.saved_talent (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients (id) on delete cascade,
  freelancer_id uuid not null references public.freelancers (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (client_id, freelancer_id)
);

-- taxonomy -------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       varchar(120) not null unique,
  name_bn    varchar(120),
  icon       varchar(50),
  sort_order integer not null default 0
);

create table if not exists public.skills (
  id          uuid primary key default gen_random_uuid(),
  name        varchar(120) not null unique,
  category_id uuid references public.categories (id) on delete set null,
  created_at  timestamptz not null default now()
);


alter table public.proposal_milestones enable row level security;
alter table public.saved_talent        enable row level security;
alter table public.categories          enable row level security;
alter table public.skills              enable row level security;

-- proposal_milestones: visible to the proposal's two parties; writable by the freelancer owner
drop policy if exists proposal_milestones_select_parties on public.proposal_milestones;
create policy proposal_milestones_select_parties on public.proposal_milestones
  for select to authenticated
  using (
    proposal_id in (
      select p.id from public.proposals p
      where p.freelancer_id in (select f.id from public.freelancers f where f.user_id = auth.uid())
         or p.project_id in (
           select pr.id from public.projects pr
           join public.clients c on c.id = pr.client_id
           where c.user_id = auth.uid()
         )
    )
  );

drop policy if exists proposal_milestones_write_own on public.proposal_milestones;
create policy proposal_milestones_write_own on public.proposal_milestones
  for all to authenticated
  using (
    proposal_id in (
      select p.id from public.proposals p
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  )
  with check (
    proposal_id in (
      select p.id from public.proposals p
      join public.freelancers f on f.id = p.freelancer_id
      where f.user_id = auth.uid()
    )
  );

-- saved_talent: owner client only
drop policy if exists saved_talent_owner_access on public.saved_talent;
create policy saved_talent_owner_access on public.saved_talent
  for all to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = auth.uid()))
  with check (client_id in (select c.id from public.clients c where c.user_id = auth.uid()));

-- taxonomy: readable by any authenticated user, writable by nobody (admin-only, future)
drop policy if exists categories_select_authenticated on public.categories;
create policy categories_select_authenticated on public.categories
  for select to authenticated using (true);

drop policy if exists skills_select_authenticated on public.skills;
create policy skills_select_authenticated on public.skills
  for select to authenticated using (true);


insert into public.categories (name, name_bn, icon, sort_order) values
  ('Web & App Development',    'ওয়েব ও অ্যাপ ডেভেলপমেন্ট',      'Code',       1),
  ('UI/UX & Graphic Design',   'গ্রাফিক্স ও ইউআই/ইউএক্স ডিজাইন', 'Palette',    2),
  ('Digital Marketing & SEO',  'ডিজিটাল মার্কেটিং ও এসইও',        'TrendingUp', 3),
  ('Video Editing & Animation','ভিডিও এডিটিং ও মোশন গ্রাফিক্স',   'Video',      4),
  ('Bangla & English Content', 'কন্টেন্ট রাইটিং ও অনুবাদ',        'FileText',   5),
  ('Virtual Assistance & Data','ভার্চুয়াল অ্যাসিস্ট্যান্ট ও ডাটা এন্ট্রি', 'Database', 6)
on conflict (name) do nothing;

insert into public.skills (name) values
  ('Web Development'), ('Data Entry'), ('PHP'), ('Android'), ('Python'), ('MySQL'),
  ('WordPress'), ('Data Scraping'), ('CSS'), ('JavaScript'), ('HTML'), ('iOS'),
  ('HTML5'), ('Web Design'), ('Administrative Support'), ('Ecommerce'),
  ('Graphic Design'), ('Social Media Marketing'), ('SEO'), ('Video Editing'),
  ('Content Writing'), ('Bangla Translation'), ('Virtual Assistance'), ('Customer Support')
on conflict (name) do nothing;
