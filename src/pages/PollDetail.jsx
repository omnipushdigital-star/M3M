import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { usePoll, useMyVote, useCastVote } from '../hooks/usePolls.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

export default function PollDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: poll, isLoading } = usePoll(id)
  const { data: myVote } = useMyVote(id)
  const cast = useCastVote(id)

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner /></div>
  if (!poll)     return <div className="p-6 text-center text-slate-500">Poll not found.</div>

  const total = poll.options.reduce((s, o) => s + (o.vote_count || 0), 0)
  const canVote = poll.status === 'active' && !myVote

  return (
    <div className="space-y-4">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-brand-600 font-medium">
        <ArrowLeft size={16}/> Back
      </button>

      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold leading-snug flex-1">{poll.question}</h1>
          <Badge color={poll.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
            {poll.status === 'active' ? 'Active' : 'Closed'}
          </Badge>
        </div>
        <div className="text-xs text-slate-500">
          Created by {poll.creator?.full_name || 'Committee'} ·
          {' '}{poll.closes_at ? `closes ${format(new Date(poll.closes_at), 'dd MMM, h:mm a')}` : 'no end date'}
        </div>

        <div className="space-y-2.5">
          {poll.options.map((o) => {
            const pct = total ? Math.round((o.vote_count / total) * 100) : 0
            const selected = myVote?.option_id === o.id
            return (
              <button
                key={o.id}
                disabled={!canVote || cast.isPending}
                onClick={() => cast.mutate(o.id)}
                className={clsx(
                  'w-full text-left relative rounded-xl border px-4 py-3 transition overflow-hidden',
                  selected ? 'border-brand-500' : 'border-slate-200',
                  canVote ? 'hover:border-brand-400 cursor-pointer' : 'cursor-default'
                )}
              >
                <div className={clsx('absolute inset-0 -z-0', selected ? 'bg-brand-50' : 'bg-slate-50')} style={{ width: `${pct}%` }} />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {selected && <Check size={14} className="text-brand-600"/>}
                    {o.option_text}
                  </span>
                  <span className="text-xs text-slate-600">{pct}% · {o.vote_count}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="text-xs text-slate-500">
          {total} {total === 1 ? 'vote' : 'votes'} · {myVote ? 'You have voted' : canVote ? 'Tap an option to vote' : poll.status === 'closed' ? 'Voting closed' : ''}
        </div>
      </Card>
    </div>
  )
}
