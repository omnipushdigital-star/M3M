import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon size={26} />
      </div>
      <h3 className="text-slate-800 font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
