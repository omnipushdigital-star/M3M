import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Search, Download, FileText, X, Trash2, Plus, FolderPlus } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import { useProfile } from '../hooks/useProfile.js'
import {
  useDocumentCategories,
  useCreateDocumentCategory,
  useDeleteDocumentCategory
} from '../hooks/useDocumentCategories.js'
import { COMMUNITY_UNIFIED } from '../lib/constants.js'
import AdSlot from '../components/ads/AdSlot.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

function prettySize(b) {
  if (!b) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0; let n = b
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`
}

export default function Documents() {
  const { profile } = useProfile()
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const isCommittee = ['committee', 'admin'].includes(profile?.role)
  const isAdmin = profile?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  const { data: categories = [] } = useDocumentCategories()

  async function deleteDoc(id) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) { alert(error.message); return }
    qc.invalidateQueries({ queryKey: ['documents'] })
  }

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*, society:societies(id, name)').order('created_at', { ascending: false })
      if (error) throw error; return data ?? []
    }
  })

  const filtered = docs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
  const grouped = categories.map((c) => ({
    category: c,
    items: filtered.filter((d) => d.category === c.value)
  }))
  // Catch any docs whose category isn't in the list (e.g., stale data)
  const knownValues = new Set(categories.map((c) => c.value))
  const orphaned = filtered.filter((d) => !knownValues.has(d.category))
  if (orphaned.length) grouped.push({ category: { value: '__orphaned', label: 'Uncategorized', id: null }, items: orphaned })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Documents</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" variant="secondary" onClick={() => setCatOpen(true)}>
              <FolderPlus size={16}/> Category
            </Button>
          )}
          {isCommittee && (
            <Button size="sm" onClick={() => setOpen(true)}><Upload size={16}/> Upload</Button>
          )}
        </div>
      </div>

      <AdSlot slotId="documents_top" size="banner" />

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
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        {!COMMUNITY_UNIFIED && d.society?.name && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-medium">{d.society.name}</span>
                        )}
                        <span>{format(new Date(d.created_at), 'dd MMM, yyyy')}</span>
                        {d.file_size ? <span>· {prettySize(d.file_size)}</span> : null}
                      </div>
                    </div>
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-slate-100 text-brand-600" aria-label="Download">
                        <Download size={18}/>
                      </a>
                    )}
                    {isAdmin && (
                      <button onClick={() => deleteDoc(d.id)} className="p-2 rounded-full hover:bg-red-50 text-red-600" aria-label="Delete">
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {open && <UploadModal onClose={() => setOpen(false)} categories={categories} />}
      {catOpen && <CategoryModal onClose={() => setCatOpen(false)} categories={categories} />}
    </div>
  )
}

function UploadModal({ onClose, categories }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const qc = useQueryClient()
  const defaultCategory = categories?.[0]?.value || 'notice'
  const [form, setForm] = useState({ name: '', category: defaultCategory })
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
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3 m-0 sm:m-4 max-h-[92vh] overflow-y-auto">
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
            {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {err && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{err}</div>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</Button>
      </form>
    </div>
  )
}

function CategoryModal({ onClose, categories }) {
  const [label, setLabel] = useState('')
  const [err, setErr] = useState(null)
  const create = useCreateDocumentCategory()
  const del = useDeleteDocumentCategory()

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    try {
      await create.mutateAsync({ label })
      setLabel('')
    } catch (e) { setErr(e.message) }
  }

  async function remove(cat) {
    if (!cat.id) { alert('Default categories cannot be removed until migration 002 is applied.'); return }
    if (!confirm(`Remove category "${cat.label}"? Documents in this category will become "Uncategorized".`)) return
    try { await del.mutateAsync(cat.id) } catch (e) { alert(e.message) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4 m-0 sm:m-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Document categories</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>

        <form onSubmit={submit} className="space-y-2">
          <label className="text-xs font-medium text-slate-600">New category name</label>
          <div className="flex gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="e.g., Audit reports"
            />
            <Button type="submit" disabled={create.isPending || !label.trim()}>
              <Plus size={16}/> Add
            </Button>
          </div>
          {err && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{err}</div>}
        </form>

        <div className="border-t border-slate-100 pt-3">
          <div className="text-xs font-medium text-slate-500 mb-2">Existing categories</div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.value} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-[11px] text-slate-400">{c.value}</div>
                </div>
                <button
                  onClick={() => remove(c)}
                  className="p-1.5 rounded-full hover:bg-red-50 text-red-600 disabled:opacity-40"
                  disabled={!c.id}
                  aria-label="Remove"
                  title={c.id ? 'Remove category' : 'Built-in default'}
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
