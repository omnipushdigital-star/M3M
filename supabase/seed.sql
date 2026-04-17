-- =====================================================================
-- SocietyConnect seed data
-- Run AFTER 001_initial.sql. Profiles reference auth.users, so create
-- three users in Supabase Auth first (Dashboard → Authentication):
--   admin@example.com     / Passw0rd!   → id saved to :admin_uid
--   committee@example.com / Passw0rd!   → id saved to :committee_uid
--   resident@example.com  / Passw0rd!   → id saved to :resident_uid
-- Replace the three UUIDs below with the actual auth user IDs, OR
-- run only the non-profile sections first and onboard users via the app.
-- =====================================================================

-- -------------------- SOCIETIES --------------------
insert into public.societies (id, name, location) values
  ('11111111-1111-1111-1111-111111111111','Smartword','Sector 89, Gurgaon'),
  ('22222222-2222-2222-2222-222222222222','M3M Soulitude','Sector 89, Gurgaon')
on conflict (name) do nothing;

-- -------------------- BLOCKS (Block M in both societies) --------------------
insert into public.blocks (id, society_id, block_code, description) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','M','Block M — Smartword'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222','M','Block M — M3M Soulitude')
on conflict (society_id, block_code) do nothing;

-- -------------------- PLOTS 98, 99, 100, 101 in Smartword Block M --------------------
insert into public.plots (id, block_id, plot_number) values
  ('c1000000-0000-0000-0000-000000000098','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','98'),
  ('c1000000-0000-0000-0000-000000000099','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','99'),
  ('c1000000-0000-0000-0000-000000000100','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','100'),
  ('c1000000-0000-0000-0000-000000000101','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','101')
on conflict (block_id, plot_number) do nothing;

-- -------------------- UNITS (4 floors + stilt/basement/rooftop placeholders) --------------------
do $$
declare
  p record;
  fl int;
begin
  for p in select id, plot_number from public.plots where block_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' loop
    for fl in 1..4 loop
      insert into public.units (plot_id, unit_code, floor_number, unit_type)
      values (p.id, 'M ' || p.plot_number || '/' || fl, fl, 'floor')
      on conflict (plot_id, unit_code, unit_type) do nothing;
    end loop;
    insert into public.units (plot_id, unit_code, unit_type) values
      (p.id, 'M ' || p.plot_number || ' Stilt',    'stilt'),
      (p.id, 'M ' || p.plot_number || ' Basement', 'basement'),
      (p.id, 'M ' || p.plot_number || ' Rooftop',  'rooftop')
    on conflict (plot_id, unit_code, unit_type) do nothing;
  end loop;
end $$;

-- -------------------- PROFILES --------------------
-- Replace these UUIDs with real auth.users IDs before running,
-- or run the seed via the app after onboarding.
-- Uncomment the block below once you have the real UIDs.
/*
with
  admin_u as (select id from public.units where unit_code = 'M 100/1' and unit_type='floor' limit 1),
  comm_u  as (select id from public.units where unit_code = 'M 100/2' and unit_type='floor' limit 1),
  res_u   as (select id from public.units where unit_code = 'M 100/3' and unit_type='floor' limit 1)
insert into public.profiles (id, full_name, phone, role, primary_unit_id, society_id) values
  ('00000000-0000-0000-0000-00000000aaaa','Aditi Sharma (Admin)','+91-9000000001','admin',
    (select id from admin_u),'11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-00000000bbbb','Rahul Verma (Committee)','+91-9000000002','committee',
    (select id from comm_u),'11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-00000000cccc','Priya Menon (Resident)','+91-9000000003','resident',
    (select id from res_u),'11111111-1111-1111-1111-111111111111')
on conflict (id) do update set
  full_name = excluded.full_name,
  role      = excluded.role,
  society_id= excluded.society_id,
  primary_unit_id = excluded.primary_unit_id;

-- Link unit owners
update public.units u set owner_id = p.id
from public.profiles p where p.primary_unit_id = u.id;

-- -------------------- SPACE ALLOCATIONS (Plot M 100) --------------------
insert into public.space_allocations (plot_id, owner_id, space_type, zone_label, description) values
  ('c1000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-00000000aaaa','stilt_parking','Slot A','Floor-1 owner parking'),
  ('c1000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-00000000bbbb','stilt_parking','Slot B','Floor-2 owner parking'),
  ('c1000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-00000000cccc','stilt_parking','Slot C','Floor-3 owner parking'),
  ('c1000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-00000000aaaa','basement','Zone North','Floor-1 owner basement share'),
  ('c1000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-00000000bbbb','basement','Zone Center','Floor-2 owner basement share'),
  ('c1000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-00000000cccc','basement','Zone South','Floor-3 owner basement share'),
  ('c1000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-00000000cccc','rooftop','Terrace East','Floor-3 owner rooftop share');

-- -------------------- ISSUES --------------------
insert into public.issues (society_id, unit_id, reported_by, title, description, category, priority, status) values
  ('11111111-1111-1111-1111-111111111111',
    (select id from public.units where unit_code='M 100/3' and unit_type='floor'),
    '00000000-0000-0000-0000-00000000cccc',
    'Frequent power cuts in Block M',
    'Since last Friday Block M has been getting short power cuts 3-4 times a day.',
    'electrical','high','open'),
  ('11111111-1111-1111-1111-111111111111',
    (select id from public.units where unit_code='M 100/1' and unit_type='floor'),
    '00000000-0000-0000-0000-00000000aaaa',
    'Stilt parking lights not working',
    'Half the stilt parking is dark after 8 PM.',
    'common_area','medium','in_progress');

-- -------------------- POLL --------------------
with new_poll as (
  insert into public.polls (id, society_id, created_by, question, status, closes_at)
  values (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-00000000bbbb',
    'Should we hire a full-time security supervisor for the common gate?',
    'active',
    now() + interval '7 days')
  returning id
)
insert into public.poll_options (poll_id, option_text) values
  ((select id from new_poll), 'Yes, we need one'),
  ((select id from new_poll), 'No, current guards are sufficient');

-- -------------------- ANNOUNCEMENT --------------------
insert into public.announcements (society_id, posted_by, title, body, tag, is_pinned) values
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000bbbb',
   'Water tanker maintenance — Sunday',
   'The common overhead tanks will be cleaned this Sunday 9 AM – 1 PM. Please store water in advance.',
   'maintenance', true);

-- -------------------- PAYMENTS --------------------
insert into public.payments (unit_id, resident_id, month_year, maintenance_amount, water_amount, parking_amount, total_amount, status) values
  ((select id from public.units where unit_code='M 100/3' and unit_type='floor'),
    '00000000-0000-0000-0000-00000000cccc','April 2026', 3500, 800, 300, 4600, 'pending'),
  ((select id from public.units where unit_code='M 100/3' and unit_type='floor'),
    '00000000-0000-0000-0000-00000000cccc','March 2026', 3500, 750, 300, 4550, 'paid');
*/
