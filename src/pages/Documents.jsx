import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Search, Download, FileText, X } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import { useProfile } from '../hooks/useProfile.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { DOCUMENT_CATEGORIES } from '../lib/constants.js'

function prettySize(b) {
  if (!b) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0; let n = b
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`
}

export default function Documents() {
  const { profile } = useProfile()
  const [query, setQuery] = useState('')
  const isCommittee = ['committee', 'admin'].includes(profile?.role)
  const [open, setOpen] = useState(false)

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', profile?.society_id],
    enabled: !!profile?.society_id,
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*').eq('society_id', profile.society_id).order('created_at', { ascending: false })
      if (error) throw error; return data ?? []
    }
  })

  const filtered = docs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
  const grouped = DOCUMENT_CATEGORIES.map((c) => ({
    category: c,
    items: filtered.filter((d) => d.category === c.value)
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Documents</h1>
        {isCommittee && (
          <Button size="sm" onClick={() => setOpen(true)}><Upload size={16}/> Upload</Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm bg-white"
          placeholder="Search documents…"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner/></div>
      ) : docs.length === 0 ? (
        <Card className="p-0"><EmptyState icon={FileText} title="No documents yet" /></Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ category, items }) => items.length > 0 && (
            <section key={category.value}>
              <h2 className="text-sm font-semibold text-slate-700 mb-2">{category.label}</h2>
              <div className="space-y-2">
                {items.map((d) => (
                  <Card key={d.id} className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <FileText size={18}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{d.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {format(new Date(d.created_at), 'dd MMM, yyyy')}
                        {d.file_size ? ` · ${prettySize(d.file_size)}` : ''}
                      </div>
                    </div>
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-slate-100 text-brand-600" aria-label="Download">
                        <Download size={18}/>
                      </a>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {open && <UploadModal onClose={() => setOpen(false)} />}
    </div>
  )
}

function UploadModal({ onClose }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', category: 'notice' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setErr(null); setBusy(true)
    try {
      if (!file) throw new Error('Please choose a file')
      const path = `${profile.society_id}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('society-documents').upload(path, file)
      if (upErr) throw upErr
      const { data: urlData } = await supabase.storage.from('society-documents').createSignedUrl(path, 60 * 60 * 24 * 365)
      const file_url = urlData?.signedUrl
      const { error } = await supabase.from('documents').insert({
        society_id: profile.society_id,
        uploaded_by: user.id,
        name: form.name || file.name,
        category: form.category,
        file_url,
        file_size: file.size
      })
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['documents'] })
      onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3 m-0 sm:m-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Upload document</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">File</label>
          <input type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Display name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder={file?.name || 'Optional'} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
            {DOCUMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {err && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{err}</div>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</Button>
      </form>
    </div>
  )
}
