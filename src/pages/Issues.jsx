import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageCircle, ThumbsUp } from 'lucide-react'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { useIssues } from '../hooks/useIssues.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Button from '../components/ui/Button.jsx'
import { ISSUE_CATEGORIES, PRIORITY_STYLES, STATUS_STYLES, STATUS_LABELS } from '../lib/constants.js'
import AdSlot from '../components/ads/AdSlot.jsx'

const TABS = [
  { key: 'all',         label: 'All' },
  { key: 'urgent',      label: 'Urgent' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved',    label: 'Resolved' }
]

function categoryMeta(value) {
  return ISSUE_CATEGORIES.find((c) => c.value === value) || ISSUE_CATEGORIES[ISSUE_CATEGORIES.length - 1]
}

export default function Issues() {
  const [tab, setTab] = useState('all')
  const { data: issues = [], isLoading } = useIssues(tab)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Issues</h1>
        <Button as={Link} to="/issues/new" size="sm"><Plus size={16}/> Report</Button>
      </div>

      <AdSlot slotId="issues_top" size="banner" />

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium border',
              tab === t.key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : issues.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No issues here"
            subtitle="Use the Report button to submit a new issue for your society."
            action={<Button as={Link} to="/issues/new" size="sm"><Plus size={16}/> Report an issue</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {issues.map((i) => {
            const cat = categoryMeta(i.category)
            return (
              <Link key={i.id} to={`/issues/${i.id}`}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{i.title}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge color={cat.color}>{cat.label}</Badge>
                        <Badge color={PRIORITY_STYLES[i.priority]}>{i.priority}</Badge>
                        <Badge color={STATUS_STYLES[i.status]}>{STATUS_LABELS[i.status]}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                    <span>{i.unit?.unit_code || 'Common area'}</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><ThumbsUp size={12}/>{i.vote_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12}/>{i.comment_count}</span>
                      <span>{formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</span>
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <Link
        to="/issues/new"
        className="fixed bottom-24 right-5 z-20 h-14 w-14 rounded-full bg-brand-600 text-white shadow-float flex items-center justify-center hover:bg-brand-700 active:scale-95"
        aria-label="Report new issue"
      >
        <Plus size={26} />
      </Link>
    </div>
  )
}
