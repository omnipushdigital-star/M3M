import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Home as HomeIcon, Car, Warehouse, Mountain, ChevronRight, Plus, X, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useProfile } from '../hooks/useProfile.js'
import { useSocieties } from '../context/SocietyContext.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { SPACE_TYPES } from '../lib/constants.js'

export default function Directory() {
  const { profile } = useProfile()
  const { societies } = useSocieties()
  const isCommittee = ['committee', 'admin'].includes(profile?.role)
  const [societyId, setSociety] = useState(profile?.society_id || '')
  const [blockId, setBlock]     = useState(null)
  const [plotId, setPlot]       = useState(null)

  // load blocks for selected society
  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks', societyId],
    enabled: !!societyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('blocks').select('*').eq('society_id', societyId).order('block_code')
      if (error) throw error; return data
    }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Property directory</h1>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="text-xs text-slate-500">Society</label>
        <select value={societyId} onChange={(e) => { setSociety(e.target.value); setBlock(null); setPlot(null) }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white">
          <option value="">Select society</option>
          {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 flex items-center flex-wrap gap-1">
        {societyId && <button onClick={() => { setBlock(null); setPlot(null) }} className="hover:text-brand-600">{societies.find((s) => s.id === societyId)?.name}</button>}
        {blockId && <><ChevronRight size={12}/><button onClick={() => setPlot(null)} className="hover:text-brand-600">Block {blocks.find((b) => b.id === blockId)?.block_code}</button></>}
        {plotId && <><ChevronRight size={12}/><span>Plot</span></>}
      </div>

      {!societyId && (
        <Card className="p-6 text-sm text-slate-500 text-center">Pick a society to start browsing.</Card>
      )}

      {societyId && !blockId && (
        <BlockList blocks={blocks} onSelect={setBlock} />
      )}

      {societyId && blockId && !plotId && (
        <PlotList blockId={blockId} onSelect={setPlot} />
      )}

      {plotId && <PlotView plotId={plotId} canEdit={isCommittee} />}
    </div>
  )
}

function BlockList({ blocks, onSelect }) {
  if (!blocks.length) return <Card className="p-6 text-sm text-slate-500 text-center">No blocks yet in this society.</Card>
  return (
    <div className="grid grid-cols-3 gap-3">
      {blocks.map((b) => (
        <button key={b.id} onClick={() => onSelect(b.id)}>
          <Card className="p-5 flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
              <Building2 size={20}/>
            </div>
            <div className="font-semibold">Block {b.block_code}</div>
            {b.description && <div className="text-[11px] text-slate-500 text-center mt-1 line-clamp-2">{b.description}</div>}
          </Card>
        </button>
      ))}
    </div>
  )
}

function PlotList({ blockId, onSelect }) {
  const { data: plots = [], isLoading } = useQuery({
    queryKey: ['plots', blockId],
    queryFn: async () => {
      const { data, error } = await supabase.from('plots').select('*').eq('block_id', blockId).order('plot_number')
      if (error) throw error; return data
    }
  })
  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner/></div>
  if (!plots.length) return <Card className="p-6 text-sm text-slate-500 text-center">No plots yet.</Card>
  return (
    <div className="grid grid-cols-2 gap-3">
      {plots.map((p) => (
        <button key={p.id} onClick={() => onSelect(p.id)}>
          <Card className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500">Plot</div>
              <div className="font-semibold text-lg">{p.plot_number}</div>
            </div>
            <ChevronRight className="text-slate-400"/>
          </Card>
        </button>
      ))}
    </div>
  )
}

function PlotView({ plotId, canEdit }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['plot-view', plotId],
    queryFn: async () => {
      const [plot, units, allocs] = await Promise.all([
        supabase.from('plots').select('*, block:blocks(block_code)').eq('id', plotId).single(),
        supabase.from('units').select('*, owner:profiles(id, full_name)').eq('plot_id', plotId).order('floor_number'),
        supabase.from('space_allocations').select('*, owner:profiles(id, full_name)').eq('plot_id', plotId).order('space_type')
      ])
      return { plot: plot.data, units: units.data ?? [], allocations: allocs.data ?? [] }
    }
  })

  const delAlloc = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('space_allocations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plot-view', plotId] })
  })

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner/></div>
  if (!data?.plot) return null

  const floors   = data.units.filter((u) => u.unit_type === 'floor')
  const stilts   = data.allocations.filter((a) => a.space_type === 'stilt_parking')
  const basement = data.allocations.filter((a) => a.space_type === 'basement')
  const rooftop  = data.allocations.filter((a) => a.space_type === 'rooftop')

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-sm text-slate-500">Plot</div>
        <div className="text-2xl font-bold">Block {data.plot.block?.block_code} · {data.plot.plot_number}</div>
      </Card>

      <Section icon={HomeIcon} title="Floor units">
        <div className="space-y-2">
          {floors.length === 0 && <div className="text-sm text-slate-500">No units seeded for this plot.</div>}
          {floors.map((u) => (
            <Card key={u.id} className="p-3 flex items-center gap-3">
              <Badge className="bg-brand-50 text-brand-700">Floor {u.floor_number}</Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{u.unit_code}</div>
                <div className="text-[11px] text-slate-500">{u.owner?.full_name || 'Unassigned'}</div>
              </div>
              {u.owner && <Avatar size="sm" name={u.owner.full_name}/>}
            </Card>
          ))}
        </div>
      </Section>

      <Section icon={Car} title="Stilt parking" action={canEdit && <AddAllocButton plotId={plotId} spaceType="stilt_parking" />}>
        <Allocs items={stilts} canEdit={canEdit} onDelete={(id) => delAlloc.mutate(id)} />
      </Section>

      <Section icon={Warehouse} title="Basement" action={canEdit && <AddAllocButton plotId={plotId} spaceType="basement" />}>
        <Allocs items={basement} canEdit={canEdit} onDelete={(id) => delAlloc.mutate(id)} />
      </Section>

      <Section icon={Mountain} title="Rooftop" action={canEdit && <AddAllocButton plotId={plotId} spaceType="rooftop" />}>
        <Allocs items={rooftop} canEdit={canEdit} onDelete={(id) => delAlloc.mutate(id)} />
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, action, children }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Icon size={14}/> {title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Allocs({ items, canEdit, onDelete }) {
  if (!items.length) return <div className="text-sm text-slate-500">No allocations yet.</div>
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <Card key={a.id} className="p-3 flex items-center gap-3">
          <Badge className="bg-slate-100 text-slate-700">{a.zone_label || '—'}</Badge>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{a.owner?.full_name || 'Shared'}</div>
            {a.description && <div className="text-[11px] text-slate-500 truncate">{a.description}</div>}
          </div>
          {canEdit && (
            <button onClick={() => onDelete(a.id)} className="text-slate-400 hover:text-red-500" aria-label="Remove"><X size={16}/></button>
          )}
        </Card>
      ))}
    </div>
  )
}

function AddAllocButton({ plotId, spaceType }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { data: owners = [] } = useQuery({
    queryKey: ['plot-owners', plotId],
    queryFn: async () => {
      const { data } = await supabase
        .from('units')
        .select('owner:profiles(id, full_name)')
        .eq('plot_id', plotId)
      const uniq = new Map()
      for (const u of data || []) if (u.owner) uniq.set(u.owner.id, u.owner)
      return [...uniq.values()]
    }
  })
  const [form, setForm] = useState({ owner_id: '', zone_label: '', description: '' })

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('space_allocations').insert({
        plot_id: plotId, space_type: spaceType,
        owner_id: form.owner_id || null,
        zone_label: form.zone_label || null,
        description: form.description || null
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plot-view', plotId] })
      setOpen(false); setForm({ owner_id: '', zone_label: '', description: '' })
    }
  })

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Plus size={14}/> Add</Button>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center">
          <form onSubmit={(e) => { e.preventDefault(); add.mutate() }}
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3 m-0 sm:m-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Add {SPACE_TYPES.find((s) => s.value === spaceType)?.label.toLowerCase()} allocation</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Owner</label>
              <select value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                <option value="">Shared / unassigned</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Zone label</label>
              <input value={form.zone_label} onChange={(e) => setForm({ ...form, zone_label: e.target.value })}
                placeholder="Slot A / Zone North / Terrace East"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <Button type="submit" className="w-full" disabled={add.isPending}>{add.isPending ? 'Saving…' : 'Save'}</Button>
          </form>
        </div>
      )}
    </>
  )
}
