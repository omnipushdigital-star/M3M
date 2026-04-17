import clsx from 'clsx'

export default function Badge({ children, className, color = 'bg-slate-100 text-slate-700' }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', color, className)}>
      {children}
    </span>
  )
}
