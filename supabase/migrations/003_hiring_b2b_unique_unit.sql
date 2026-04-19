-- ============================================================
-- 003_hiring_b2b_unique_unit.sql
-- Adds Hiring listings, B2B business listings, and enforces
-- one-profile-per-flat via a partial unique index.
-- ============================================================

-- ------------------------------------------------------------
-- 1) HIRING LISTINGS (maids, cooks, car cleaners, etc.)
-- ------------------------------------------------------------
create table if not exists public.hiring_listings (
  id           uuid primary key default gen_random_uuid(),
  society_id   uuid not null references public.societies(id) on delete cascade,
  posted_by    uuid not null references public.profiles(id)  on delete cascade,
  kind         text not null default 'offering'
    check (kind in ('offering','wanted')),
  category     text not null,            -- maid, cook, car_cleaner, driver, nanny, gardener, electrician, plumber, tutor, other
  person_name  text,
  phone        text,
  whatsapp     text,
  description  text,
  days_available text,                   -- "Mon-Sat" / "Weekends only"
  timings      text,                     -- "7am - 11am"
  rate         text,                     -- "₹4000/mo" / "₹200/visit"
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists hiring_listings_society_idx  on public.hiring_listings(society_id);
create index if not exists hiring_listings_category_idx on public.hiring_listings(category);
create index if not exists hiring_listings_active_idx   on public.hiring_listings(is_active);

alter table public.hiring_listings enable row level security;

-- All authenticated users can read listings from BOTH societies (cross-society visibility)
drop policy if exists hiring_read on public.hiring_listings;
create policy hiring_read on public.hiring_listings
  for select to authenticated using (true);

-- Any signed-in resident can post
drop policy if exists hiring_insert on public.hiring_listings;
create policy hiring_insert on public.hiring_listings
  for insert to authenticated
  with check (posted_by = auth.uid());

-- Poster or admin can update / delete
drop policy if exists hiring_update on public.hiring_listings;
create policy hiring_update on public.hiring_listings
  for update to authenticated
  using (
    posted_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists hiring_delete on public.hiring_listings;
create policy hiring_delete on public.hiring_listings
  for delete to authenticated
  using (
    posted_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ------------------------------------------------------------
-- 2) BUSINESSES (B2B / resident business promotion)
-- ------------------------------------------------------------
create table if not exists public.businesses (
  id           uuid primary key default gen_random_uuid(),
  society_id   uuid not null references public.societies(id) on delete cascade,
  owner_id     uuid not null references public.profiles(id)  on delete cascade,
  name         text not null,
  category     text not null,            -- food, fashion, health, education, home_services, technology, real_estate, events, retail, other
  description  text,
  phone        text,
  whatsapp     text,
  website      text,
  instagram    text,
  member_offer text,                     -- "10% off for society members"
  logo_url     text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists businesses_society_idx  on public.businesses(society_id);
create index if not exists businesses_category_idx on public.businesses(category);
create index if not exists businesses_active_idx   on public.businesses(is_active);

alter table public.businesses enable row level security;

-- Cross-society visibility
drop policy if exists businesses_read on public.businesses;
create policy businesses_read on public.businesses
  for select to authenticated using (true);

drop policy if exists businesses_insert on public.businesses;
create policy businesses_insert on public.businesses
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists businesses_update on public.businesses;
create policy businesses_update on public.businesses
  for update to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists businesses_delete on public.businesses;
create policy businesses_delete on public.businesses
  for delete to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ------------------------------------------------------------
-- 3) ONE REGISTRATION PER FLAT
--    Enforce at DB level: only one profile may claim any given
--    primary_unit_id. Partial index skips NULLs so unfinished
--    onboarding profiles don't conflict.
-- ------------------------------------------------------------
create unique index if not exists profiles_primary_unit_unique
  on public.profiles(primary_unit_id)
  where primary_unit_id is not null;
