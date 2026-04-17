import clsx from 'clsx'

export default function LoadingSpinner({ className, size = 24 }) {
  return (
    <svg
      className={clsx('animate-spin text-brand-600', className)}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
