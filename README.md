# SocietyConnect

A Progressive Web App for managing two group housing societies — **Smartword** and **M3M Soulitude** — in Sector 89, Gurgaon. Both societies share a common entry gate but are managed separately.

Built with **Vite + React**, **Supabase**, **TailwindCSS**, **TanStack Query**, **React Router**, and **vite-plugin-pwa**.

---

## Key features

- Email/password auth with first-login onboarding (society + unit code)
- Role-based access: `resident`, `committee`, `admin` (enforced via Postgres RLS)
- Home dashboard with stat cards, pinned announcements, latest issues
- Issues module: list with filters, detail with comments + upvotes (one per resident), photo upload to Supabase Storage
- Polls: active polls with live percentage bars, one vote per resident, committee can create
- Payments: monthly dues summary (maintenance / water / parking), payment history, UPI deep-link placeholder
- Property directory (unique): Society → Block → Plot → Units + stilt parking / basement / rooftop allocations
- Documents: searchable, grouped by category, signed URLs for private bucket
- Notifications: bell dropdown with realtime updates
- Mobile-first PWA with offline fallback and app icon

---

## 1. Setup

```bash
git clone https://github.com/omnipushdigital-star/M3M.git
cd M3M
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Fill in your Supabase project values:

```
VITE_SUPABASE_URL=https://befkpzwbbdauxoovnwqg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...      # from Supabase Dashboard → Project Settings → API
```

---

## 2. Apply the Supabase migration

You can use the Supabase SQL editor, or the CLI.

### Option A — Supabase Dashboard (easiest)

1. Open your project at https://supabase.com/dashboard.
2. Go to **SQL Editor → New query**.
3. Paste the contents of `supabase/migrations/001_initial.sql` and run it.

### Option B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref befkpzwbbdauxoovnwqg
supabase db push          # applies files in supabase/migrations/
```

The migration creates every table, RLS policy, helper function, storage bucket (`issue-images`, `society-documents`) and realtime publication.

---

## 3. Seed sample data

`supabase/seed.sql` seeds:

- 2 societies (Smartword, M3M Soulitude)
- Block M with plots 98, 99, 100, 101 (Smartword)
- 4 floor units + stilt/basement/rooftop per plot
- 3 sample profiles (admin / committee / resident) linked to M 100/1, M 100/2, M 100/3
- Space allocations, 2 issues, 1 poll, 1 announcement, 2 payments

Because profiles reference `auth.users`, you need the three test users to exist first:

1. In Supabase Dashboard → **Authentication → Users**, create:
   - `admin@example.com`      (password `Passw0rd!`)
   - `committee@example.com`  (password `Passw0rd!`)
   - `resident@example.com`   (password `Passw0rd!`)
2. Copy each user's UUID.
3. In `supabase/seed.sql`, replace the three placeholder UUIDs (`00000000-0000-0000-0000-00000000aaaa`, `...bbbb`, `...cccc`) with the real UUIDs, then uncomment the block (remove the `/* ... */`).
4. Run the updated `supabase/seed.sql` in SQL Editor.

*(If you'd rather skip manual seeding, the non-profile sections at the top of the file can be run as-is. Residents can then sign up via the app and onboard themselves.)*

---

## 4. Run locally

```bash
npm run dev      # http://localhost:5173
```

Build + preview:

```bash
npm run build
npm run preview
```

When deployed over HTTPS the app installs as a PWA (offline fallback ships as `public/offline.html`).

---

## 5. Folder structure

```
.
├── index.html
├── package.json
├── vite.config.js              # Vite + PWA + Tailwind
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── public/
│   ├── icons/icon-192.png      # PWA icons (replace with real artwork)
│   ├── icons/icon-512.png
│   ├── favicon.svg
│   ├── offline.html            # SW offline fallback
│   └── robots.txt
├── supabase/
│   ├── migrations/001_initial.sql   # schema + RLS + buckets + realtime
│   └── seed.sql                     # sample societies/blocks/plots/users
└── src/
    ├── main.jsx                # React + QueryClient + Router + Providers
    ├── App.jsx                 # routing + auth guard
    ├── index.css               # Tailwind directives
    ├── lib/
    │   ├── supabase.js         # createClient()
    │   └── constants.js        # categories / styles / helpers
    ├── context/
    │   ├── AuthContext.jsx     # session + sign-in/out
    │   └── SocietyContext.jsx  # list of societies
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useProfile.js
    │   ├── useIssues.js        # list / detail / comments (realtime) / votes
    │   ├── usePolls.js
    │   ├── usePayments.js
    │   └── useNotifications.js
    ├── components/
    │   ├── layout/ BottomNav | Header (bell + profile) | Layout
    │   └── ui/     Badge | Card | Button | Avatar | EmptyState | LoadingSpinner
    └── pages/
        ├── Login.jsx
        ├── Onboarding.jsx
        ├── Home.jsx
        ├── Issues.jsx | IssueDetail.jsx | NewIssue.jsx
        ├── Polls.jsx | PollDetail.jsx
        ├── Payments.jsx
        ├── Documents.jsx
        ├── Directory.jsx        # blocks → plots → units + allocations
        └── Profile.jsx
```

---

## 6. Setting committee / admin roles

Profile rows default to `role = 'resident'`. To promote:

```sql
-- In Supabase SQL editor
update public.profiles
set role = 'committee'
where id = (select id from auth.users where email = 'committee@example.com');

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

The helper function `public.is_committee_or_admin()` drives every write-side RLS policy, so role changes take effect immediately.

---

## 7. Adding a new society or block

All property CRUD happens server-side (via SQL or, for committee/admin users, through the directory UI). A typical setup:

```sql
-- 1. Create the society
insert into public.societies (name, location)
values ('New Society', 'Sector 89, Gurgaon')
returning id;

-- 2. Create a block inside it (replace the society UUID)
insert into public.blocks (society_id, block_code, description)
values ('<society-uuid>', 'A', 'Block A — front side');

-- 3. Create plots
insert into public.plots (block_id, plot_number)
values ('<block-uuid>', '100'), ('<block-uuid>', '101');

-- 4. Auto-generate units for those plots
do $$
declare p record; fl int;
begin
  for p in select id, plot_number, (select block_code from public.blocks b where b.id = plots.block_id) as block_code
           from public.plots where block_id = '<block-uuid>' loop
    for fl in 1..4 loop
      insert into public.units (plot_id, unit_code, floor_number, unit_type)
      values (p.id, p.block_code || ' ' || p.plot_number || '/' || fl, fl, 'floor');
    end loop;
    insert into public.units (plot_id, unit_code, unit_type) values
      (p.id, p.block_code || ' ' || p.plot_number || ' Stilt',    'stilt'),
      (p.id, p.block_code || ' ' || p.plot_number || ' Basement', 'basement'),
      (p.id, p.block_code || ' ' || p.plot_number || ' Rooftop',  'rooftop');
  end loop;
end $$;
```

Residents can then onboard by entering any of the `unit_code`s above (e.g. `A 100/2`).

---

## 8. Production notes

- **Storage buckets** — `issue-images` is public-read (so issue photos render without signed URLs). `society-documents` is private; `Documents.jsx` requests signed URLs that expire in 1 year.
- **Realtime** — `issue_comments`, `issues`, `notifications`, and `poll_votes` are added to the `supabase_realtime` publication. `useIssueComments` and `useNotifications` subscribe via Postgres Changes.
- **Payments** — the `Pay now` button triggers a UPI deep-link and optimistically marks the row `paid`. For production, integrate Razorpay/PhonePe and verify via webhook before flipping `status = 'paid'`.
- **Icons** — `public/icons/icon-*.png` are generated placeholders; replace with real artwork before listing on the Play/App Store.

---

## Repo

[omnipushdigital-star/M3M](https://github.com/omnipushdigital-star/M3M)
