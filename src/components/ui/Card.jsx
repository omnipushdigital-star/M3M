import clsx from 'clsx'

export default function Card({ className, children, onClick, as: As = 'div', ...rest }) {
  return (
    <As
      onClick={onClick}
      className={clsx(
        'rounded-2xl bg-white shadow-card border border-slate-100',
        onClick && 'cursor-pointer hover:shadow-float transition',
        className
      )}
      {...rest}
    >
      {children}
    </As>
  )
}
