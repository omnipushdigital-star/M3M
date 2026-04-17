import { NavLink } from 'react-router-dom'
import { Home, AlertCircle, BarChart3, CreditCard, FileText } from 'lucide-react'
import clsx from 'clsx'

const items = [
  { to: '/',           label: 'Home',     icon: Home },
  { to: '/issues',     label: 'Issues',   icon: AlertCircle },
  { to: '/polls',      label: 'Polls',    icon: BarChart3 },
  { to: '/payments',   label: 'Payments', icon: CreditCard },
  { to: '/documents',  label: 'Docs',     icon: FileText }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 safe-pb">
      <ul className="flex justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-medium',
                  isActive ? 'text-brand-600' : 'text-slate-500'
                )
              }
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
