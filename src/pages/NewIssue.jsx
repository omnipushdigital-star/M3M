import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import clsx from 'clsx'
import { useCreateIssue } from '../hooks/useIssues.js'
import { useAuth } from '../hooks/useAuth.js'
import { supabase } from '../lib/supabase.js'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { ISSUE_CATEGORIES } from '../lib/constants.js'

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high',   label: 'High',   color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
]

export default function NewIssue() {
  const nav = useNavigate()
  const { user } = useAuth()
  const create = useCreateIssue()
  const [form, setForm] = useState({
    title: '', description: '', category: 'maintenance', priority: 'medium'
  })
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      let image_url = null
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('issue-images').upload(path, file)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('issue-images').getPublicUrl(path)
        image_url = pub.publicUrl
      }
      const issue = await create.mutateAsync({ ...form, image_url })
      nav(`/issues/${issue.id}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create issue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-brand-600 font-medium">
        <ArrowLeft size={16}/> Back
      </button>
      <h1 className="text-xl font-bold">Report an issue</h1>

      <form onSubmit={submit}>
        <Card className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Short summary of the issue"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white">
              {ISSUE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Priority</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {PRIORITIES.map((p) => (
                <button key={p.value} type="button" onClick={() => setForm({ ...form, priority: p.value })}
                  className={clsx(
                    'py-2 rounded-lg text-xs font-medium border transition',
                    form.priority === p.value
                      ? 'bg-brand-600 text-white border-brand-600'
                      : `${p.color} border-transparent`
                  )}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Give the committee enough detail to act on this."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Photo (optional)</label>
            <label className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
              <Camera size={18}/>
              {file ? file.name : 'Tap to add a photo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit issue'}
          </Button>
        </Card>
      </form>
    </div>
  )
}
