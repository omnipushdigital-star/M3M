import { useState } from 'react'
import { LogOut, Building2, Phone, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useProfile, useUpdateProfile } from '../hooks/useProfile.js'
import Card from '../components/ui/Card.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

const ROLE_STYLES = {
  resident:  'bg-slate-100 text-slate-700',
  committee: 'bg-blue-100 text-blue-700',
  admin:     'bg-amber-100 text-amber-800'
}

export default function Profile() {
  const { profile, loading } = useProfile()
  const { signOut, user } = useAuth()
  const update = useUpdateProfile()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [err, setErr]   = useState(null)

  if (loading || !profile) return <div className="flex justify-center py-10"><LoadingSpinner/></div>

  function startEdit() {
    setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
    setEditing(true)
  }

  async function save(e) {
    e.preventDefault(); setErr(null)
    try {
      await update.mutateAsync(form)
      setEditing(false)
    } catch (e) { setErr(e.message) }
  }

  async function doSignOut() {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 flex items-center gap-4">
        <Avatar size="lg" name={profile.full_name} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg truncate">{profile.full_name || 'Resident'}</div>
          <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          <Badge className="mt-1" color={ROLE_STYLES[profile.role]}>{profile.role}</Badge>
        </div>
      </Card>

      {editing ? (
        <Card className="p-5">
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Full name</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            {err && <div className="text-xs text-red-600">{err}</div>}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={update.isPending}>Save</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-0 divide-y divide-slate-100">
          <Row icon={Building2} label="Society" value={profile.society?.name || '—'} />
          <Row icon={Building2} label="Unit"    value={profile.primary_unit?.unit_code || '—'} />
          <Row icon={Phone}     label="Phone"   value={profile.phone || '—'} />
          <Row icon={ShieldCheck} label="Role"  value={<Badge color={ROLE_STYLES[profile.role]}>{profile.role}</Badge>} />
        </Card>
      )}

      {!editing && (
        <Button variant="secondary" className="w-full" onClick={startEdit}>Edit profile</Button>
      )}

      <Link to="/directory">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Property directory</div>
            <div className="text-xs text-slate-500">Browse blocks, plots & allocations</div>
          </div>
          <span className="text-slate-400">›</span>
        </Card>
      </Link>

      <Button variant="danger" className="w-full" onClick={doSignOut}>
        <LogOut size={16}/> Sign out
      </Button>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Icon size={16}/></div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}
