import clsx from 'clsx'

const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'

const variants = {
  primary:  'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary:'bg-white text-brand-700 border border-slate-200 hover:bg-slate-50',
  ghost:    'bg-transparent text-brand-700 hover:bg-brand-50',
  danger:   'bg-red-600 text-white hover:bg-red-700 shadow-sm'
}
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  as: As = 'button',
  ...rest
}) {
  return (
    <As className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </As>
  )
}
