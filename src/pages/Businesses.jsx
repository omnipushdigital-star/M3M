import { useState } from 'react'
import { useProfile } from '../hooks/useProfile.js'
import { useAuth } from '../hooks/useAuth.js'
import { useBusinesses, useCreateBusiness, useDeleteBusiness } from '../hooks/useBusinesses.js'
import { BUSINESS_CATEGORIES, COMMUNITY_UNIFIED } from '../lib/constants.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Plus, X, Phone, MessageCircle, Globe, Instagram, Trash2, Briefcase, Search, Gift } from 'lucide-react'
import AdSlot from '../components/ads/AdSlot.jsx'

function categoryLabel(value) {
  return BUSINESS_CATEGORIES.find((c) => c.value === value)?.label || value
}

export default function Businesses() {
  const { profile } = useProfile()
  const { user } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data: businesses = [], isLoading } = useBusinesses(category)
  const del = useDeleteBusiness()

  const filtered = businesses.filter((b) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      b.name?.toLowerCase().includes(s) ||
      b.description?.toLowerCase().includes(s) ||
      categoryLabel(b.category).toLowerCase().includes(s)
    )
  })

  async function remove(id) {
    if (!confirm('Delete this business listing?')) return
    try { await del.mutateAsync(id) } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Member businesses</h1>
          <p className="text-xs text-slate-500">Support fellow residents — shop, book, connect.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={16}/> List</Button>
      </div>

      <AdSlot slotId="businesses_top" size="banner" />

      {/* Search + filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm bg-white"
            placeholder="Search businesses…"
          />
        </div>
        <select
          value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="all">All categories</option>
          {BUSINESS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner/></div>
      ) : filtered.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={Briefcase} title="No businesses yet" description="Run a business? Be the first to list it." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const canDelete = isAdmin || b.owner_id === user?.id
            return (
              <Card key={b.id} className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="h-12 w-12 rounded-xl object-cover bg-slate-100 shrink-0"/>
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                      <Briefcase size={20}/>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">{categoryLabel(b.category)}</span>
                          {!COMMUNITY_UNIFIED && b.society?.name && (
                            <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-medium">{b.society.name}</span>
                          )}
                          {b.owner?.full_name && <span>by {b.owner.full_name}</span>}
                        </div>
                      </div>
                      {canDelete && (
                        <button onClick={() => remove(b.id)} className="p-1.5 rounded-full hover:bg-red-50 text-red-600 shrink-0" aria-label="Delete">
                          <Trash2 size={15}/>
                        </button>
                      )}
                    </div>
                    {b.description && <div className="text-sm text-slate-600 mt-1.5 whitespace-pre-line">{b.description}</div>}
                    {b.member_offer && (
                      <div className="mt-2 text-xs flex items-start gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-md">
                        <Gift size={14} className="shrink-0 mt-px"/>
                        <span>{b.member_offer}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {b.phone && (
                    <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100">
                      <Phone size={13}/> Call
                    </a>
                  )}
                  {b.whatsapp && (
                    <a href={`https://wa.me/${b.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                      <MessageCircle size={13}/> WhatsApp
                    </a>
                  )}
                  {b.website && (
                    <a href={/^https?:\/\//.test(b.website) ? b.website : `https://${b.website}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
                      <Globe size={13}/> Website
                    </a>
                  )}
                  {b.instagram && (
                    <a href={b.instagram.startsWith('http') ? b.instagram : `https://instagram.com/${b.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 hover:bg-pink-100">
                      <Instagram size={13}/> Instagram
                    </a>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {open && <BusinessModal onClose={() => setOpen(false)} />}
    </div>
  )
}

function BusinessModal({ onClose }) {
  const create = useCreateBusiness()
  const [form, setForm] = useState({
    name: '',
    category: 'food',
    description: '',
    phone: '',
    whatsapp: '',
    website: '',
    instagram: '',
    member_offer: '',
    logo_url: ''
  })
  const [err, setErr] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    try {
      if (!form.name.trim()) throw new Error('Business name is required')
      const clean = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? (v.trim() || null) : v])
      )
      clean.name = form.name.trim()
      clean.category = form.category
      await create.mutateAsync(clean)
      onClose()
    } catch (e) { setErr(e.message) }
  }

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3 m-0 sm:m-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">List your business</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Business name *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g., Naveen's Bakery" />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Category</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
            {BUSINESS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="What you do, who you serve, experience…" />
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Website</label>
            <input value={form.website} onChange={(e) => set('website', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="example.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Instagram</label>
            <input value={form.instagram} onChange={(e) => set('instagram', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="@handle or URL" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Logo URL (optional)</label>
          <input value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="https://…" />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Special offer for society members (optional)</label>
          <input value={form.member_offer} onChange={(e) => set('member_offer', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="10% off for society residents" />
        </div>

        {err && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{err}</div>}

        <Button type="submit" className="w-full" disabled={create.isPending}>
          {create.isPending ? 'Submitting…' : 'List business'}
        </Button>
      </form>
    </div>
  )
}
