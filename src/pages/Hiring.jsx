import { useState } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import { useAuth } from '../hooks/useAuth.js'
import { useHiringListings, useCreateHiring, useDeleteHiring } from '../hooks/useHiring.js'
import { HIRING_CATEGORIES, COMMUNITY_UNIFIED } from '../lib/constants.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Plus, X, Phone, MessageCircle, Trash2, HandHeart, Search } from 'lucide-react'
import { format } from 'date-fns'
import AdSlot from '../components/ads/AdSlot.jsx'

const KIND_LABEL = { offering: 'Offering', wanted: 'Looking for' }
const KIND_STYLE = {
  offering: 'bg-emerald-100 text-emerald-800',
  wanted:   'bg-amber-100 text-amber-800'
}

function categoryLabel(value) {
  return HIRING_CATEGORIES.find((c) => c.value === value)?.label || value
}

export default function Hiring() {
  const { profile } = useProfile()
  const { user } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [category, setCategory] = useState('all')
  const [kind, setKind] = useState('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data: listings = [], isLoading } = useHiringListings(category, kind)
  const del = useDeleteHiring()

  const filtered = listings.filter((l) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      l.person_name?.toLowerCase().includes(s) ||
      l.description?.toLowerCase().includes(s) ||
      l.phone?.includes(s) ||
      categoryLabel(l.category).toLowerCase().includes(s)
    )
  })

  async function remove(id) {
    if (!confirm('Delete this listing?')) return
    try { await del.mutateAsync(id) } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Hiring & Help</h1>
          <p className="text-xs text-slate-500">Recommend or find maids, cooks, drivers & more.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={16}/> Post</Button>
      </div>

      <AdSlot slotId="hiring_top" size="banner" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm bg-white"
          placeholder="Search by name, phone, service…"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={kind} onChange={(e) => setKind(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="all">All posts</option>
          <option value="offering">Offering / Recommending</option>
          <option value="wanted">Looking for</option>
        </select>
        <select
          value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="all">All services</option>
          {HIRING_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner/></div>
      ) : filtered.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={HandHeart} title="No listings yet" description="Be the first to recommend a trusted helper or post a request." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const canDelete = isAdmin || l.posted_by === user?.id
            return (
              <Card key={l.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${KIND_STYLE[l.kind]}`}>
                        {KIND_LABEL[l.kind]}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {categoryLabel(l.category)}
                      </span>
                      {!COMMUNITY_UNIFIED && l.society?.name && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                          {l.society.name}
                        </span>
                      )}
                    </div>
                    {l.person_name && <div className="font-semibold mt-1.5">{l.person_name}</div>}
                    {l.description && <div className="text-sm text-slate-600 mt-0.5 whitespace-pre-line">{l.description}</div>}
                    <div className="text-[11px] text-slate-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      {l.days_available && <span>📅 {l.days_available}</span>}
                      {l.timings       && <span>⏰ {l.timings}</span>}
                      {l.rate          && <span>💰 {l.rate}</span>}
                    </div>
                  </div>
                  {canDelete && (
                    <button onClick={() => remove(l.id)} className="p-1.5 rounded-full hover:bg-red-50 text-red-600 shrink-0" aria-label="Delete">
                      <Trash2 size={15}/>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                  {l.phone && (
                    <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100">
                      <Phone size={13}/> {l.phone}
                    </a>
                  )}
                  {l.whatsapp && (
                    <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                      <MessageCircle size={13}/> WhatsApp
                    </a>
                  )}
                  <div className="ml-auto text-[11px] text-slate-400 self-center">
                    Posted by {l.poster?.full_name || '—'} · {format(new Date(l.created_at), 'dd MMM')}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {open && <PostModal onClose={() => setOpen(false)} />}
    </div>
  )
}

function PostModal({ onClose }) {
  const create = useCreateHiring()
  const [form, setForm] = useState({
    kind: 'offering',
    category: 'maid',
    person_name: '',
    phone: '',
    whatsapp: '',
    description: '',
    days_available: '',
    timings: '',
    rate: ''
  })
  const [err, setErr] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    try {
      await create.mutateAsync({
        ...form,
        person_name: form.person_name.trim() || null,
        phone:       form.phone.trim()       || null,
        whatsapp:    form.whatsapp.trim()    || null,
        description: form.description.trim() || null,
        days_available: form.days_available.trim() || null,
        timings:        form.timings.trim()        || null,
        rate:           form.rate.trim()           || null
      })
      onClose()
    } catch (e) { setErr(e.message) }
  }

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3 m-0 sm:m-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Post a hiring listing</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Type</label>
            <select value={form.kind} onChange={(e) => set('kind', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
              <option value="offering">Offering / Recommending</option>
              <option value="wanted">Looking for</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Service</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
              {HIRING_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Name of the helper (optional)</label>
          <input value={form.person_name} onChange={(e) => set('person_name', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g., Lata Devi" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Phone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="+91-9xxxxxxxxx" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">WhatsApp</label>
            <input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="same as phone" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Reliable, works with my family for 3 years, speaks Hindi…" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Days</label>
            <input value={form.days_available} onChange={(e) => set('days_available', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Mon–Sat" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Timings</label>
            <input value={form.timings} onChange={(e) => set('timings', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="7–11 am" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Rate</label>
            <input value={form.rate} onChange={(e) => set('rate', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="₹4000/mo" />
          </div>
        </div>

        {err && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{err}</div>}

        <Button type="submit" className="w-full" disabled={create.isPending}>
          {create.isPending ? 'Posting…' : 'Post listing'}
        </Button>
      </form>
    </div>
  )
}
