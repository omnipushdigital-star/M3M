-- ============================================================
-- 002_document_categories.sql
-- Adds a user-manageable `document_categories` table so admins
-- can create new categories at runtime (instead of hard-coded list).
-- ============================================================

create table if not exists public.document_categories (
  id          uuid primary key default gen_random_uuid(),
  value       text not null unique,           -- slug used as FK-like value on documents.category
  label       text not null,                  -- display label
  sort_order  int  not null default 100,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists document_categories_value_idx on public.document_categories(value);

-- Seed the defaults (idempotent)
insert into public.document_categories (value, label, sort_order) values
  ('minutes',   'Meeting minutes',     10),
  ('bylaws',    'Bylaws',              20),
  ('financial', 'Financial reports',   30),
  ('notice',    'Notices',             40),
  ('other',     'Other',               999)
on conflict (value) do nothing;

-- ============================================================
-- RLS: everyone signed-in can read; only admins can insert/delete
-- ============================================================
alter table public.document_categories enable row level security;

drop policy if exists document_categories_read on public.document_categories;
create policy document_categories_read on public.document_categories
  for select to authenticated using (true);

drop policy if exists document_categories_admin_insert on public.document_categories;
create policy document_categories_admin_insert on public.document_categories
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists document_categories_admin_delete on public.document_categories;
create policy document_categories_admin_delete on public.document_categories
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- Admin can delete any document (was previously uploader-only)
-- ============================================================
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
  for delete to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
