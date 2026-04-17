import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ThumbsUp, Send, User as UserIcon } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'
import {
  useIssue, useIssueComments, useAddComment,
  useToggleIssueVote, useHasVoted
} from '../hooks/useIssues.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import { ISSUE_CATEGORIES, PRIORITY_STYLES, STATUS_STYLES, STATUS_LABELS } from '../lib/constants.js'

export default function IssueDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: issue, isLoading } = useIssue(id)
  const { data: comments = [] } = useIssueComments(id)
  const { data: voted = false } = useHasVoted(id)
  const toggleVote = useToggleIssueVote(id)
  const addComment = useAddComment(id)
  const [body, setBody] = useState('')

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner /></div>
  if (!issue)     return <div className="p-6 text-center text-slate-500">Issue not found.</div>

  const cat = ISSUE_CATEGORIES.find((c) => c.value === issue.category) || ISSUE_CATEGORIES[ISSUE_CATEGORIES.length - 1]

  async function submit(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    await addComment.mutateAsync(text)
    setBody('')
  }

  return (
    <div className="space-y-4">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-brand-600 font-medium">
        <ArrowLeft size={16}/> Back
      </button>

      <Card className="p-5 space-y-3">
        <h1 className="text-lg font-bold leading-snug">{issue.title}</h1>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge color={cat.color}>{cat.label}</Badge>
          <Badge color={PRIORITY_STYLES[issue.priority]}>{issue.priority}</Badge>
          <Badge color={STATUS_STYLES[issue.status]}>{STATUS_LABELS[issue.status]}</Badge>
        </div>
        {issue.description && (
          <p className="text-sm text-slate-700 whitespace-pre-line">{issue.description}</p>
        )}
        {issue.image_url && (
          <img src={issue.image_url} alt="issue" className="rounded-lg max-h-72 w-full object-cover" />
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <Meta label="Reporter"   value={issue.reporter?.full_name || '—'} />
          <Meta label="Assigned to" value={issue.assignee?.full_name || 'Unassigned'} />
          <Meta label="Location"   value={issue.unit?.unit_code || 'Common area'} />
          <Meta label="Reported"   value={format(new Date(issue.created_at), 'dd MMM, h:mm a')} />
          <Meta label="Votes"      value={issue.vote_count} />
          <Meta label="Updated"    value={format(new Date(issue.updated_at), 'dd MMM, h:mm a')} />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => toggleVote.mutate(voted)}
            disabled={toggleVote.isPending}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition',
              voted ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
            )}
          >
            <ThumbsUp size={16}/>
            {voted ? 'Voted' : 'Upvote'}
          </button>
        </div>
      </Card>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Discussion ({comments.length})</h2>
        <div className="space-y-2">
          {comments.length === 0 && (
            <Card className="p-4 text-sm text-slate-500 text-center">Be the first to comment.</Card>
          )}
          {comments.map((c) => (
            <Card key={c.id} className="p-3 flex gap-3">
              <Avatar name={c.author?.full_name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.author?.full_name || 'Resident'}</span>
                  <span className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line">{c.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm bg-white"
          />
          <Button type="submit" size="md" disabled={addComment.isPending || !body.trim()}>
            <Send size={16}/>
          </Button>
        </form>
      </section>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  )
}
