import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import BottomNav from './BottomNav.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
