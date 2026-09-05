import { useEffect, useState, type PropsWithChildren } from 'react'
import { BarChart3, BookOpen, CircleUserRound, Dumbbell, FlaskConical, Home, ListPlus, Plus, Sparkles, Utensils } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { Brand } from './Brand'
import { QuickAdd } from './QuickAdd'
import { cn } from '../lib/cn'
import { useData } from '../context/DataContext'

const nav = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/train', label: 'Workouts', icon: Dumbbell },
  { to: '/study', label: 'Study', icon: BookOpen },
  { to: '/life', label: 'Life', icon: Sparkles },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
]

export function AppShell({ children }: PropsWithChildren) {
  const [quickOpen, setQuickOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const { syncPending } = useData()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(id)
  }, [toast])

  return (
    <div className="app-shell">
      <aside className="desktop-rail">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('nav-item', isActive && 'active')}><Icon size={20} /><span>{label}</span></NavLink>)}
        </nav>
        <div className="desktop-profile">
          {syncPending && <div className="badge badge-warm" style={{ margin: '0 12px 12px' }}>Offline · changes queued</div>}
          <NavLink to="/nutrition" className={({ isActive }) => cn('nav-item', isActive && 'active')}><Utensils size={20} /><span>Nutrition</span></NavLink>
          <NavLink to="/health" className={({ isActive }) => cn('nav-item', isActive && 'active')}><FlaskConical size={20} /><span>Health</span></NavLink>
          <NavLink to="/settings" className={({ isActive }) => cn('nav-item', isActive && 'active')}><CircleUserRound size={20} /><span>Profile & settings</span></NavLink>
        </div>
      </aside>

      <main className="app-main">
        <header className="mobile-appbar"><Brand/><NavLink to="/settings" className={({ isActive }) => cn('mobile-profile-link', isActive && 'active')} aria-label="Open profile and settings"><CircleUserRound size={22}/><span>Profile</span></NavLink></header>
        {children}
      </main>

      <button className="add-fab" type="button" onClick={() => setQuickOpen(true)} aria-label="Quick add"><Plus size={25} /></button>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('nav-item', isActive && 'active')}><Icon size={20} /><span>{label}</span></NavLink>)}
      </nav>

      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} onSaved={setToast} />
      {toast && <div className="toast" role="status"><ListPlus size={15} style={{ display: 'inline', marginRight: 7, verticalAlign: -3 }} />{toast}</div>}
    </div>
  )
}
