import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, BarChart3, CreditCard, Users, Plus, Pin, Building2, HandHeart, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useProfile } from '../hooks/useProfile.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { STATUS_STYLES, STATUS_LABELS, CURRENCY, formatMonthYear, COMMUNITY_UNIFIED } from '../lib/constants.js'
import { formatDistanceToNow } from 'date-fns'
import AdSlot from '../components/ads/AdSlot.jsx'

function StatCard({ icon: Icon, label, value, color, to }) {
  const body = (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export default function Home() {
  const { profile, loading } = useProfile()
  const month = formatMonthYear()

  const { data: stats } = useQuery({
    queryKey: ['home-stats', profile?.id, month],
    enabled: !!profile,
    queryFn: async () => {
      const [openIssues, activePolls, dueThisMonth, activeResidents, pinned, latest] = await Promise.all([
        supabase.from('issues').select('id', { count: 'exact', head: true })
          .in('status', ['open','in_progress']),
        supabase.from('polls').select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase.from('payments').select('total_amount')
          .eq('resident_id', profile.id).eq('month_year', month).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('announcements').select('*, society:societies(id, name)').eq('is_pinned', true)
          .order('created_at', { ascending: false }).limit(2),
        supabase.from('issues').select('id, title, status, created_at, priority, society:societies(id, name)')
          .order('created_at', { ascending: false }).limit(2)
      ])
      const dueAmount = (dueThisMonth.data ?? []).reduce((s, p) => s + (p.total_amount || 0), 0)
      return {
        openIssues: openIssues.count ?? 0,
        activePolls: activePolls.count ?? 0,
        due: dueAmount,
        residents: activeResidents.count ?? 0,
        pinned: pinned.data ?? [],
        latest: latest.data ?? []
      }
    }
  })

  if (loading || !profile) {
    return <div className="flex justify-center py-10"><LoadingSpinner /></div>
  }

  const firstName = (profile.full_name || 'Resident').split(' ')[0]

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Hi, {firstName}</h1>
        <p className="text-sm text-slate-500">
          {profile.primary_unit?.unit_code || 'Your unit'} · {profile.society?.name}
        </p>
      </section>

      <AdSlot slotId="home_top" size="banner" />

      <section className="grid grid-cols-2 gap-3">
        <StatCard icon={AlertCircle} label="Open issues"  value={stats?.openIssues ?? '—'} color="bg-orange-50 text-orange-600"   to="/issues" />
        <StatCard icon={BarChart3}   label="Active polls" value={stats?.activePolls ?? '—'} color="bg-purple-50 text-purple-600" to="/polls" />
        <StatCard icon={CreditCard}  label="Due this month" value={`${CURRENCY}${(stats?.due ?? 0).toLocaleString('en-IN')}`} color="bg-red-50 text-red-600" to="/payments" />
        <StatCard icon={Users}       label="Active residents" value={stats?.residents ?? '—'} color="bg-emerald-50 text-emerald-600" />
      </section>

      <AdSlot slotId="home_between" size="leaderboard" />

      <section className="space-y-2">
        <Link to="/directory">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Property directory</div>
              <div className="text-xs text-slate-500">Browse blocks, plots, units & allocations</div>
            </div>
            <span className="text-slate-400">›</span>
          </Card>
        </Link>

        <Link to="/hiring">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HandHeart size={20} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Hiring & Help</div>
              <div className="text-xs text-slate-500">Maids, cooks, drivers, car cleaners & more</div>
            </div>
            <span className="text-slate-400">›</span>
          </Card>
        </Link>

        <Link to="/businesses">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Member businesses</div>
              <div className="text-xs text-slate-500">Support fellow residents — shop, book, connect</div>
            </div>
            <span className="text-slate-400">›</span>
          </Card>
        </Link>
      </section>

      {stats?.pinned?.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Pinned announcements</h2>
          <div className="space-y-2">
            {stats.pinned.map((a) => (
              <Card key={a.id} className="p-4 border-l-4 border-l-amber-400">
                <div className="flex items-start gap-2">
                  <Pin size={14} className="text-amber-500 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold">{a.title}</div>
                    {a.body && <div className="text-sm text-slate-600 mt-0.5 whitespace-pre-line">{a.body}</div>}
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {!COMMUNITY_UNIFIED && a.society?.name && <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-medium">{a.society.name}</span>}
                      <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                      {a.tag && <Badge className="ml-1">{a.tag}</Badge>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">Latest issues</h2>
          <Link to="/issues" className="text-xs text-brand-600 font-medium">See all</Link>
        </div>
        {stats?.latest?.length ? (
          <div className="space-y-2">
            {stats.latest.map((i) => (
              <Link key={i.id} to={`/issues/${i.id}`}>
                <Card className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{i.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {!COMMUNITY_UNIFIED && i.society?.name && <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-medium">{i.society.name}</span>}
                      <span>{formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Badge color={STATUS_STYLES[i.status]}>{STATUS_LABELS[i.status]}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-5 text-sm text-slate-500 text-center">Nothing here yet.</Card>
        )}
      </section>

      <Link
        to="/issues/new"
        className="fixed bottom-24 right-5 z-20 h-14 w-14 rounded-full bg-brand-600 text-white shadow-float flex items-center justify-center hover:bg-brand-700 active:scale-95"
        aria-label="Report new issue"
      >
        <Plus size={26} />
      </Link>
    </div>
  )
}
