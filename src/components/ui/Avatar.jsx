import clsx from 'clsx'

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]).join('').toUpperCase()
}

export default function Avatar({ name, size = 'md', className }) {
  const dims = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  return (
    <div className={clsx(
      'inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold',
      dims, className
    )}>
      {initials(name)}
    </div>
  )
}
