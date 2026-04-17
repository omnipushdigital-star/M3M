# Deploying SocietyConnect to Vercel

Pick one of the two paths below. **Path A** (git import) is faster if you want auto-deploys on every commit. **Path B** (CLI) is faster if you don't want to connect a repo yet.

The Supabase URL and anon key are already baked into `src/lib/supabase.js` as safe defaults (anon keys are designed for browser use — RLS protects your data), so the site will work immediately after deploy. You can still override them in Vercel's env vars later.

---

## Path A — Push to GitHub, import on Vercel (recommended)

### 1. Push this folder to your GitHub repo

Open a terminal **on your own computer** in this folder and run:

```bash
# If the folder already has a stale .git directory, start fresh:
rm -rf .git

git init -b main
git add .
git commit -m "Initial SocietyConnect PWA"
git remote add origin https://github.com/omnipushdigital-star/M3M.git

# First push — use --force if the repo already has content:
git push -u origin main --force
```

> If `rm -rf .git` fails, skip it; if `git init` complains "already a git repository", just continue.

### 2. Import the repo on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Under **Import Git Repository**, select `omnipushdigital-star/M3M`.
3. Project name: `societyconnect` (or anything you like).
4. Framework preset: **Vite** (auto-detected).
5. Build command: `vite build` · Output directory: `dist` (auto-filled).
6. **Environment Variables** (optional — defaults are baked in, but best practice is to set them here):
   - `VITE_SUPABASE_URL` → `https://befkpzwbbdauxoovnwqg.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → *(your anon key)*
7. Click **Deploy**. First build finishes in ~1 minute.

Every future `git push origin main` will auto-redeploy.

---

## Path B — Deploy via Vercel CLI (no GitHub needed)

From a terminal on your computer, in this folder:

```bash
npm install -g vercel    # one-time
vercel login             # opens a browser tab to log in
vercel --prod            # first run will ask a few setup questions
```

Answer the prompts like this:

```
? Set up and deploy "M3M-SW-89"?                      Y
? Which scope should contain your project?            omnipushdigital-7953's projects
? Link to existing project?                           N
? What's your project's name?                         societyconnect
? In which directory is your code located?            ./
? Want to modify these settings?                      N
```

That's it — Vercel will build and deploy, and print the production URL.

To add env vars after the first deploy:

```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod            # redeploy with new env vars
```

---

## Path C — Restore the bundled git history (if Path A's `git init` fails)

This folder ships with `societyconnect.gitbundle` — a compressed git repo containing the initial commit. If you'd rather import that instead of running `git init`:

```bash
# From an empty, parallel folder (outside M3M-SW-89):
mkdir ../M3M-clone && cd ../M3M-clone
git clone ../M3M-SW-89/societyconnect.gitbundle .
git remote set-url origin https://github.com/omnipushdigital-star/M3M.git
git push -u origin main --force
```

Then follow **Path A step 2** above to import on Vercel.

---

## After deploy: apply the Supabase migration

Vercel only hosts the frontend — your database lives in Supabase. Before login will work:

1. In [Supabase Dashboard](https://supabase.com/dashboard/project/befkpzwbbdauxoovnwqg/sql/new), paste the contents of `supabase/migrations/001_initial.sql` into a new SQL query and run it.
2. Create test users under **Authentication → Users**, then (optionally) edit + run `supabase/seed.sql` to populate sample societies, issues, and polls.
3. Sign up via your deployed URL — the app will walk you through onboarding.

See `README.md` §2 and §3 for full migration and seeding details.
