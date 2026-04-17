import { createClient } from '@supabase/supabase-js'

// Anon keys are designed to be shipped to the browser — all access is still
// enforced server-side via Row Level Security. The literals below are used as
// a fallback when the env vars aren't set (e.g. a fresh Vercel deploy before
// you configure env vars). Override them by setting VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY in .env.local or Vercel → Project → Settings → Environment Variables.
const DEFAULT_URL  = 'https://befkpzwbbdauxoovnwqg.supabase.co'
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZmtwendiYmRhdXhvb3Zud3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTM5MDksImV4cCI6MjA5MTk2OTkwOX0.Upe7P99z-wFD35UFQIEfZvrKU3pIeguotpp8jPjy9GE'

const url  = import.meta.env.VITE_SUPABASE_URL  || DEFAULT_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: { params: { eventsPerSecond: 5 } }
})
