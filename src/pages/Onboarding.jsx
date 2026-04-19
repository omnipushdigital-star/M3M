import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useProfile, useUpdateProfile } from '../hooks/useProfile.js'
import { useSocieties } from '../context/SocietyContext.jsx'
import { supabase } from '../lib/supabase.js'
import Button from '../components/ui/Button.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

export default function Onboarding() {
  const { session } = useAuth()
  const { profile, loading } = useProfile()
  const { societies } = useSocieties()
  const update = useUpdateProfile()
  const nav = useNavigate()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [societyId, setSociety] = useState('')
  const [blockId, setBlockId]   = useState('')
  const [plotId, setPlotId]     = useState('')
  const [unitId, setUnitId]     = useState('')
  const [blocks, setBlocks]     = useState([])
  const [plots, setPlots]       = useState([])
  const [units, setUnits]       = useState([])
  const [unitTaken, setUnitTaken] = useState(false)
  const [takenBy, setTakenBy]     = useState(null)
  const [checking, setChecking]   = useState(false)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setSociety(profile.society_id ?? '')
    }
  }, [profile])

  // Load blocks whenever the society changes
  useEffect(() => {
    setBlockId(''); setPlotId(''); setUnitId('')
    setPlots([]); setUnits([])
    if (!societyId) { setBlocks([]); return }
    supabase
      .from('blocks')
      .select('id, block_code')
      .eq('society_id', societyId)
      .order('block_code')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setBlocks(data ?? [])
      })
  }, [societyId])

  // Load plots whenever the block changes
  useEffect(() => {
    setPlotId(''); setUnitId(''); setUnits([])
    if (!blockId) { setPlots([]); return }
    supabase
      .from('plots')
      .select('id, plot_number')
      .eq('block_id', blockId)
      .then(({ data, error }) => {
        if (error) { setError(error.message); return }
        const sorted = (data ?? []).slice().sort((a, b) => {
          const na = Number(a.plot_number); const nb = Number(b.plot_number)
          if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
          return String(a.plot_number).localeCompare(String(b.plot_number))
        })
        setPlots(sorted)
      })
  }, [blockId])

  // Load floor units whenever the plot changes
  useEffect(() => {
    setUnitId('')
    if (!plotId) { setUnits([]); return }
    supabase
      .from('units')
      .select('id, unit_code, floor_number')
      .eq('plot_id', plotId)
      .eq('unit_type', 'floor')
      .order('floor_number')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setUnits(data ?? [])
      })
  }, [plotId])

  // Whenever the selected unit changes, check whether some other profile
  // has already claimed this flat (one registration per flat).
  useEffect(() => {
    setUnitTaken(false); setTakenBy(null)
    if (!unitId || !profile?.id) return
    setChecking(true)
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('primary_unit_id', unitId)
      .neq('id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        setChecking(false)
        if (data) { setUnitTaken(true); setTakenBy(data.full_name || null) }
      })
  }, [unitId, profile?.id])

  if (!session) return <Navigate to="/login" replace />
  if (loading)  return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>
  if (profile?.society_id && profile?.primary_unit_id) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError(null); setSaving(true)
    try {
      if (!unitId) throw new Error('Please select your Block, Plot, and Floor.')
      if (unitTaken) {
        throw new Error(
          `This flat is already registered${takenBy ? ` by ${takenBy}` : ''}. Only one registration per flat is allowed. Please contact the committee if this is your home.`
        )
      }
      await update.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim(),
        society_id: societyId,
        primary_unit_id: unitId
      })
      nav('/', { replace: true })
    } catch (err) {
      // Translate DB unique-violation into a friendlier message
      const msg = err?.message || 'Could not save profile'
      if (msg.includes('profiles_primary_unit_unique') || msg.includes('duplicate key')) {
        setError('This flat is already registered. Only one registration is allowed per flat.')
      } else {
        setError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const selectedSociety = societies.find((s) => s.id === societyId)
  const logoFor = (name) => {
    if (!name) return null
    const n = name.toLowerCase()
    if (n.includes('smart')) return '/logos/smartworld.svg'
    if (n.includes('m3m'))   return '/logos/m3m.svg'
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-white rounded-lg p-2 shadow-card">
            <img src="/logos/smartworld.svg" alt="Smart World" className="h-8 w-auto" />
          </div>
          <div className="bg-white rounded-lg p-2 shadow-card">
            <img src="/logos/m3m.svg" alt="M3M" className="h-8 w-auto" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-brand-700">Welcome!</h1>
        <p className="text-sm text-slate-600 mt-1">A few quick details so we can link you to your home.</p>

        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-card space-y-4 mt-6">
          <div>
            <label className="text-xs font-medium text-slate-600">Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Phone</label>
            <input required value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="+91-9xxxxxxxxx" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Society</label>
            <select required value={societyId} onChange={(e) => setSociety(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white">
              <option value="">Select a society</option>
              {societies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {selectedSociety && logoFor(selectedSociety.name) && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <img src={logoFor(selectedSociety.name)} alt={selectedSociety.name} className="h-6 w-auto" />
                <span className="text-xs text-slate-600">{selectedSociety.name}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Block</label>
              <select required value={blockId} onChange={(e) => setBlockId(e.target.value)}
                disabled={!societyId || blocks.length === 0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">—</option>
                {blocks.map((b) => <option key={b.id} value={b.id}>{b.block_code}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Plot</label>
              <select required value={plotId} onChange={(e) => setPlotId(e.target.value)}
                disabled={!blockId || plots.length === 0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">—</option>
                {plots.map((p) => <option key={p.id} value={p.id}>{p.plot_number}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Floor</label>
              <select required value={unitId} onChange={(e) => setUnitId(e.target.value)}
                disabled={!plotId || units.length === 0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">—</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.floor_number}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 -mt-1">Pick your block, plot, and floor to link your unit. Only one registration is allowed per flat.</p>

          {checking && <div className="text-[11px] text-slate-500">Checking unit availability…</div>}
          {unitTaken && (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-md">
              This flat is already registered{takenBy ? ` by ${takenBy}` : ''}. Only one registration is allowed per flat — please choose the correct flat or contact the committee.
            </div>
          )}

          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

          <Button type="submit" size="lg" className="w-full" disabled={saving || !unitId || unitTaken || checking}>
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
