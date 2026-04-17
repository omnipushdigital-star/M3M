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
  const [unitCode, setUnitCode] = useState('')
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setSociety(profile.society_id ?? '')
    }
  }, [profile])

  if (!session) return <Navigate to="/login" replace />
  if (loading)  return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>
  if (profile?.society_id && profile?.primary_unit_id) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError(null); setSaving(true)
    try {
      // 1. Find the unit under the chosen society matching unit_code
      const { data: units, error: unitErr } = await supabase
        .from('units')
        .select('id, unit_code, unit_type, plot:plots!inner(id, block:blocks!inner(id, society_id))')
        .eq('unit_code', unitCode.trim())
        .eq('unit_type', 'floor')
      if (unitErr) throw unitErr
      const unit = (units ?? []).find((u) => u.plot?.block?.society_id === societyId)
      if (!unit) throw new Error(`Unit "${unitCode}" not found in the selected society. Ask the committee to seed your unit first.`)

      await update.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim(),
        society_id: societyId,
        primary_unit_id: unit.id
      })
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not save profile')
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
          <div>
            <label className="text-xs font-medium text-slate-600">Unit code</label>
            <input required value={unitCode} onChange={(e) => setUnitCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="e.g. M 100/2" />
            <p className="text-[11px] text-slate-500 mt-1">Format: Block Plot/Floor — e.g. M 100/2</p>
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
