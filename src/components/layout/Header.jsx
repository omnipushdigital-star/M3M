import { useState, useRef, useEffect } from 'react'
import { Bell, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotifications, useMarkAllRead } from '../../hooks/useNotifications.js'
import { useProfile } from '../../hooks/useProfile.js'
import { formatDistanceToNow } from 'date-fns'

export default function Header() {
  const { profile } = useProfile()
  const { data: notifications = [] } = useNotifications()
  const markAll = useMarkAllRead()
  const unread = notifications.filter((n) => !n.is_read).length
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) markAll.mutate()
  }

  const societyName = profile?.society?.name
  const logoSrc = societyName?.toLowerCase().includes('smart')
    ? '/logos/smartworld.svg'
    : societyName?.toLowerCase().includes('m3m')
      ? '/logos/m3m.svg'
      : null

  return (
    <header className="sticky top-0 z-30 bg-brand-600 text-white safe-pt">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {logoSrc ? (
            <div className="bg-white rounded-md px-1.5 py-1 flex items-center">
              <img src={logoSrc} alt={societyName} className="h-6 w-auto" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center font-bold">S</div>
          )}
          <div className="leading-tight">
            <div className="font-semibold">SocietyConnect</div>
            <div className="text-[11px] opacity-80">{societyName ?? 'Sector 89, Gurgaon'}</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <div className="relative" ref={ref}>
            <button onClick={toggle} className="relative p-2 rounded-full hover:bg-white/10" aria-label="Notifications">
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center px-1">
                  {unread}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-white text-slate-800 shadow-float overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 font-semibold">Notifications</div>
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 && (
                    <div className="px-4 py-8 text-sm text-slate-500 text-center">You're all caught up.</div>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 text-sm">
                      <div className="font-medium">{n.title}</div>
                      {n.body && <div className="text-slate-500 text-xs mt-0.5">{n.body}</div>}
                      <div className="text-[11px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => nav('/profile')} className="p-2 rounded-full hover:bg-white/10" aria-label="Profile">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
