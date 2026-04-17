import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, BarChart3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { usePolls, useCreatePoll } from '../hooks/usePolls.js'
import { useProfile } from '../hooks/useProfile.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

function totalVotes(options = []) {
  return options.reduce((s, o) => s + (o.vote_count || 0), 0)
}

export default function Polls() {
  const { profile } = useProfile()
  const isCommittee = ['committee', 'admin'].includes(profile?.role)
  const { data: polls = [], isLoading } = usePolls()
  const [modal, setModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Polls</h1>
        {isCommittee && (
          <Button size="sm" onClick={() => setModal(true)}><Plus size={16}/> New poll</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : polls.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={BarChart3}
            title="No polls yet"
            subtitle={isCommittee ? 'Create your first poll to gather community input.' : 'Your committee hasn\'t posted any polls.'}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {polls.map((p) => {
            const total = totalVotes(p.options)
            return (
              <Link key={p.id} to={`/polls/${p.id}`}>
                <Card className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold flex-1">{p.question}</div>
                    <Badge color={p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {p.status === 'active' ? 'Active' : 'Closed'}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {p.options.map((o) => {
                      const pct = total ? Math.round((o.vote_count / total) * 100) : 0
                      return (
                        <div key={o.id}>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700">{o.option_text}</span>
                            <span className="text-slate-500">{pct}% · {o.vote_count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                            <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{total} {total === 1 ? 'vote' : 'votes'}</span>
                    <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {modal && <CreatePollModal onClose={() => setModal(false)} />}
    </div>
  )
}

function CreatePollModal({ onClose }) {
  const create = useCreatePoll()
  const [question, setQuestion] = useState('')
  const [opts, setOpts] = useState(['', ''])
  const [days, setDays] = useState(7)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  function setOpt(i, v) { const n = [...opts]; n[i] = v; setOpts(n) }
  function addOpt() { if (opts.length < 6) setOpts([...opts, '']) }
  function remOpt(i) { setOpts(opts.filter((_, idx) => idx !== i)) }

  async function submit(e) {
    e.preventDefault()
    setErr(null); setBusy(true)
    try {
      const closes_at = new Date(Date.now() + Number(days) * 864e5).toISOString()
      await create.mutateAsync({ question, options: opts.map((o) => o.trim()).filter(Boolean), closes_at })
      onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3 m-0 sm:m-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Create a poll</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Question</label>
          <input required value={question} onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Options</label>
          <div className="space-y-2 mt-1">
            {opts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={o} onChange={(e) => setOpt(i, e.target.value)} required
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder={`Option ${i+1}`} />
                {opts.length > 2 && (
                  <button type="button" onClick={() => remOpt(i)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
                )}
              </div>
            ))}
            {opts.length < 6 && (
              <button type="button" onClick={addOpt} className="text-xs text-brand-600 font-medium">+ Add option</button>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Close after</label>
          <select value={days} onChange={(e) => setDays(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white">
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
        {err && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{err}</div>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Saving…' : 'Create poll'}</Button>
      </form>
    </div>
  )
}
