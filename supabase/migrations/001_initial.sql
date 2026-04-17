-- =====================================================================
-- SocietyConnect — initial schema
-- Two group housing societies (Smartword & M3M Soulitude), Sector 89 Gurgaon
-- Address format: Block / Plot / Floor  e.g. "M 100/2"
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- SOCIETIES
-- ---------------------------------------------------------------------
create table if not exists public.societies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  location      text,
  entry_type    text not null default 'common',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BLOCKS
-- ---------------------------------------------------------------------
create table if not exists public.blocks (
  id            uuid primary key default gen_random_uuid(),
  society_id    uuid not null references public.societies(id) on delete cascade,
  block_code    text not null,
  description   text,
  unique (society_id, block_code)
);
create index if not exists idx_blocks_society on public.blocks(society_id);

-- ---------------------------------------------------------------------
-- PLOTS
-- ---------------------------------------------------------------------
create table if not exists public.plots (
  id            uuid primary key default gen_random_uuid(),
  block_id      uuid not null references public.blocks(id) on delete cascade,
  plot_number   text not null,
  total_floors  int not null default 4,
  has_basement  boolean not null default true,
  has_stilt     boolean not null default true,
  has_rooftop   boolean not null default true,
  unique (block_id, plot_number)
);
create index if not exists idx_plots_block on public.plots(block_id);

-- ---------------------------------------------------------------------
-- PROFILES (mirrors auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  phone           text,
  role            text not null default 'resident' check (role in ('resident','committee','admin')),
  primary_unit_id uuid,
  society_id      uuid references public.societies(id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists idx_profiles_society on public.profiles(society_id);

-- ---------------------------------------------------------------------
-- UNITS
-- ---------------------------------------------------------------------
create table if not exists public.units (
  id            uuid primary key default gen_random_uuid(),
  plot_id       uuid not null references public.plots(id) on delete cascade,
  unit_code     text not null,  -- e.g. "M 100/2"
  floor_number  int,             -- 1–4 for living floors; null for stilt/basement/rooftop
  unit_type     text not null check (unit_type in ('floor','stilt','basement','rooftop')),
  owner_id      uuid references public.profiles(id) on delete set null,
  is_active     boolean not null default true,
  unique (plot_id, unit_code, unit_type)
);
create index if not exists idx_units_plot   on public.units(plot_id);
create index if not exists idx_units_owner  on public.units(owner_id);

-- FK from profiles.primary_unit_id -> units(id) (deferred because both tables reference each other)
alter table public.profiles
  drop constraint if exists profiles_primary_unit_fk;
alter table public.profiles
  add constraint profiles_primary_unit_fk
  foreign key (primary_unit_id) references public.units(id) on delete set null;

-- ---------------------------------------------------------------------
-- SPACE ALLOCATIONS (stilt parking / basement / rooftop zones per owner)
-- ---------------------------------------------------------------------
create table if not exists public.space_allocations (
  id            uuid primary key default gen_random_uuid(),
  plot_id       uuid not null references public.plots(id) on delete cascade,
  owner_id      uuid references public.profiles(id) on delete set null,
  space_type    text not null check (space_type in ('stilt_parking','basement','rooftop')),
  zone_label    text,
  description   text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_space_plot  on public.space_allocations(plot_id);
create index if not exists idx_space_owner on public.space_allocations(owner_id);

-- ---------------------------------------------------------------------
-- ISSUES
-- ---------------------------------------------------------------------
create table if not exists public.issues (
  id            uuid primary key default gen_random_uuid(),
  society_id    uuid not null references public.societies(id) on delete cascade,
  unit_id       uuid references public.units(id) on delete set null,
  reported_by   uuid not null references public.profiles(id) on delete cascade,
  assigned_to   uuid references public.profiles(id) on delete set null,
  title         text not null,
  description   text,
  category      text not null check (category in ('electrical','sanitation','parking','security','water','common_area','maintenance','other')),
  priority      text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status        text not null default 'open'   check (status in ('open','in_progress','resolved','closed')),
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_issues_society  on public.issues(society_id);
create index if not exists idx_issues_reporter on public.issues(reported_by);
create index if not exists idx_issues_status   on public.issues(status);

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_issues_touch on public.issues;
create trigger trg_issues_touch before update on public.issues
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- ISSUE COMMENTS
-- ---------------------------------------------------------------------
create table if not exists public.issue_comments (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_comments_issue on public.issue_comments(issue_id);

-- ---------------------------------------------------------------------
-- ISSUE VOTES
-- ---------------------------------------------------------------------
create table if not exists public.issue_votes (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues(id) on delete cascade,
  resident_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (issue_id, resident_id)
);

-- ---------------------------------------------------------------------
-- ANNOUNCEMENTS
-- ---------------------------------------------------------------------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references public.societies(id) on delete cascade,
  posted_by   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  body        text,
  tag         text,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_announcements_society on public.announcements(society_id);

-- ---------------------------------------------------------------------
-- POLLS
-- ---------------------------------------------------------------------
create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references public.societies(id) on delete cascade,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  question    text not null,
  status      text not null default 'active' check (status in ('active','closed')),
  closes_at   timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.poll_options (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references public.polls(id) on delete cascade,
  option_text  text not null,
  vote_count   int not null default 0
);
create index if not exists idx_poll_options_poll on public.poll_options(poll_id);

create table if not exists public.poll_votes (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references public.polls(id) on delete cascade,
  option_id    uuid not null references public.poll_options(id) on delete cascade,
  resident_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (poll_id, resident_id)
);

-- Trigger to auto-maintain poll_options.vote_count
create or replace function public.handle_poll_vote()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.poll_options set vote_count = vote_count + 1 where id = new.option_id;
  elsif tg_op = 'DELETE' then
    update public.poll_options set vote_count = greatest(vote_count - 1, 0) where id = old.option_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_poll_vote on public.poll_votes;
create trigger trg_poll_vote after insert or delete on public.poll_votes
for each row execute function public.handle_poll_vote();

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  unit_id             uuid not null references public.units(id) on delete cascade,
  resident_id         uuid not null references public.profiles(id) on delete cascade,
  month_year          text not null,  -- "April 2026"
  maintenance_amount  int not null default 0,
  water_amount        int not null default 0,
  parking_amount      int not null default 0,
  total_amount        int not null default 0,
  status              text not null default 'pending' check (status in ('pending','paid','overdue')),
  payment_ref         text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists idx_payments_resident on public.payments(resident_id);
create index if not exists idx_payments_month    on public.payments(month_year);

-- ---------------------------------------------------------------------
-- DOCUMENTS
-- ---------------------------------------------------------------------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  society_id   uuid not null references public.societies(id) on delete cascade,
  uploaded_by  uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  category     text not null check (category in ('minutes','bylaws','financial','notice','other')),
  file_url     text,
  file_size    bigint,
  created_at   timestamptz not null default now()
);
create index if not exists idx_documents_society on public.documents(society_id);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  resident_id  uuid not null references public.profiles(id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text,
  ref_id       uuid,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists idx_notifications_resident on public.notifications(resident_id);

-- =====================================================================
-- HELPERS FOR RLS (security definer to avoid recursion)
-- =====================================================================
create or replace function public.current_profile_society()
returns uuid language sql security definer stable as $$
  select society_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_committee_or_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select role in ('committee','admin') from public.profiles where id = auth.uid()), false);
$$;

-- Auto-create profile row on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.societies          enable row level security;
alter table public.blocks             enable row level security;
alter table public.plots              enable row level security;
alter table public.units              enable row level security;
alter table public.profiles           enable row level security;
alter table public.space_allocations  enable row level security;
alter table public.issues             enable row level security;
alter table public.issue_comments     enable row level security;
alter table public.issue_votes        enable row level security;
alter table public.announcements      enable row level security;
alter table public.polls              enable row level security;
alter table public.poll_options       enable row level security;
alter table public.poll_votes         enable row level security;
alter table public.payments           enable row level security;
alter table public.documents          enable row level security;
alter table public.notifications      enable row level security;

-- ---- societies (all authenticated users can read; admins can write)
drop policy if exists "societies read" on public.societies;
create policy "societies read" on public.societies for select using (auth.role() = 'authenticated');

drop policy if exists "societies admin write" on public.societies;
create policy "societies admin write" on public.societies for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

-- ---- blocks / plots / units (read by authenticated; edit by committee/admin)
drop policy if exists "blocks read" on public.blocks;
create policy "blocks read" on public.blocks for select using (auth.role() = 'authenticated');

drop policy if exists "blocks commit" on public.blocks;
create policy "blocks commit" on public.blocks for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

drop policy if exists "plots read" on public.plots;
create policy "plots read" on public.plots for select using (auth.role() = 'authenticated');

drop policy if exists "plots commit" on public.plots;
create policy "plots commit" on public.plots for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

drop policy if exists "units read" on public.units;
create policy "units read" on public.units for select using (auth.role() = 'authenticated');

drop policy if exists "units commit" on public.units;
create policy "units commit" on public.units for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

-- ---- profiles: read others in same society; write only self (plus committee/admin full)
drop policy if exists "profiles read same society" on public.profiles;
create policy "profiles read same society" on public.profiles for select using (
  id = auth.uid()
  or society_id = public.current_profile_society()
  or public.is_committee_or_admin()
);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles for insert with check (id = auth.uid());

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update
  using (id = auth.uid() or public.is_committee_or_admin())
  with check (id = auth.uid() or public.is_committee_or_admin());

-- ---- space_allocations
drop policy if exists "allocations read" on public.space_allocations;
create policy "allocations read" on public.space_allocations for select using (auth.role() = 'authenticated');

drop policy if exists "allocations commit" on public.space_allocations;
create policy "allocations commit" on public.space_allocations for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

-- ---- issues: members of the society can read; reporter can update theirs; committee/admin can update all
drop policy if exists "issues read by society" on public.issues;
create policy "issues read by society" on public.issues for select using (
  society_id = public.current_profile_society() or public.is_committee_or_admin()
);

drop policy if exists "issues insert by member" on public.issues;
create policy "issues insert by member" on public.issues for insert with check (
  reported_by = auth.uid() and society_id = public.current_profile_society()
);

drop policy if exists "issues update owner or committee" on public.issues;
create policy "issues update owner or committee" on public.issues for update
  using (reported_by = auth.uid() or public.is_committee_or_admin())
  with check (reported_by = auth.uid() or public.is_committee_or_admin());

-- ---- issue comments
drop policy if exists "comments read" on public.issue_comments;
create policy "comments read" on public.issue_comments for select using (
  exists (
    select 1 from public.issues i
    where i.id = issue_comments.issue_id
      and (i.society_id = public.current_profile_society() or public.is_committee_or_admin())
  )
);
drop policy if exists "comments insert" on public.issue_comments;
create policy "comments insert" on public.issue_comments for insert with check (author_id = auth.uid());

drop policy if exists "comments update own" on public.issue_comments;
create policy "comments update own" on public.issue_comments for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ---- issue votes
drop policy if exists "votes read" on public.issue_votes;
create policy "votes read" on public.issue_votes for select using (auth.role() = 'authenticated');

drop policy if exists "votes insert own" on public.issue_votes;
create policy "votes insert own" on public.issue_votes for insert with check (resident_id = auth.uid());

drop policy if exists "votes delete own" on public.issue_votes;
create policy "votes delete own" on public.issue_votes for delete using (resident_id = auth.uid());

-- ---- announcements
drop policy if exists "announcements read" on public.announcements;
create policy "announcements read" on public.announcements for select using (
  society_id = public.current_profile_society() or public.is_committee_or_admin()
);
drop policy if exists "announcements commit" on public.announcements;
create policy "announcements commit" on public.announcements for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

-- ---- polls / options
drop policy if exists "polls read" on public.polls;
create policy "polls read" on public.polls for select using (
  society_id = public.current_profile_society() or public.is_committee_or_admin()
);
drop policy if exists "polls commit" on public.polls;
create policy "polls commit" on public.polls for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

drop policy if exists "poll options read" on public.poll_options;
create policy "poll options read" on public.poll_options for select using (auth.role() = 'authenticated');

drop policy if exists "poll options commit" on public.poll_options;
create policy "poll options commit" on public.poll_options for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

-- ---- poll votes (one vote per resident via unique constraint)
drop policy if exists "poll votes read" on public.poll_votes;
create policy "poll votes read" on public.poll_votes for select using (auth.role() = 'authenticated');

drop policy if exists "poll votes insert own" on public.poll_votes;
create policy "poll votes insert own" on public.poll_votes for insert with check (resident_id = auth.uid());

-- ---- payments (residents see their own; committee/admin see all)
drop policy if exists "payments read" on public.payments;
create policy "payments read" on public.payments for select using (
  resident_id = auth.uid() or public.is_committee_or_admin()
);
drop policy if exists "payments write committee" on public.payments;
create policy "payments write committee" on public.payments for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

drop policy if exists "payments update own status" on public.payments;
create policy "payments update own status" on public.payments for update
  using (resident_id = auth.uid()) with check (resident_id = auth.uid());

-- ---- documents
drop policy if exists "documents read" on public.documents;
create policy "documents read" on public.documents for select using (auth.role() = 'authenticated');

drop policy if exists "documents commit" on public.documents;
create policy "documents commit" on public.documents for all
  using (public.is_committee_or_admin())
  with check (public.is_committee_or_admin());

-- ---- notifications (only owner)
drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications for select using (resident_id = auth.uid());

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications for update
  using (resident_id = auth.uid()) with check (resident_id = auth.uid());

drop policy if exists "notifications insert system" on public.notifications;
create policy "notifications insert system" on public.notifications for insert with check (
  resident_id = auth.uid() or public.is_committee_or_admin()
);

-- =====================================================================
-- REALTIME PUBLICATION (for live issue comments / notifications)
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.issue_comments;
alter publication supabase_realtime add table public.issues;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.poll_votes;

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('issue-images', 'issue-images', true),
  ('society-documents', 'society-documents', false)
on conflict (id) do nothing;

-- Public read for issue-images
drop policy if exists "issue images public read"   on storage.objects;
create policy "issue images public read" on storage.objects for select
  using (bucket_id = 'issue-images');

drop policy if exists "issue images auth write"    on storage.objects;
create policy "issue images auth write" on storage.objects for insert
  with check (bucket_id = 'issue-images' and auth.role() = 'authenticated');

drop policy if exists "issue images owner update"  on storage.objects;
create policy "issue images owner update" on storage.objects for update
  using (bucket_id = 'issue-images' and owner = auth.uid())
  with check (bucket_id = 'issue-images' and owner = auth.uid());

-- society-documents: auth read, committee/admin write
drop policy if exists "documents bucket read" on storage.objects;
create policy "documents bucket read" on storage.objects for select
  using (bucket_id = 'society-documents' and auth.role() = 'authenticated');

drop policy if exists "documents bucket write" on storage.objects;
create policy "documents bucket write" on storage.objects for insert
  with check (bucket_id = 'society-documents' and public.is_committee_or_admin());

drop policy if exists "documents bucket update" on storage.objects;
create policy "documents bucket update" on storage.objects for update
  using (bucket_id = 'society-documents' and public.is_committee_or_admin())
  with check (bucket_id = 'society-documents' and public.is_committee_or_admin());
