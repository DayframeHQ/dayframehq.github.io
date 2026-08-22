import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthProvider'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataProvider'
import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { Brand } from './components/Brand'
import { supabase } from './lib/supabase'

const TodayPage = lazy(() => import('./pages/TodayPage').then((module) => ({ default: module.TodayPage })))
const TrainPage = lazy(() => import('./pages/TrainPage').then((module) => ({ default: module.TrainPage })))
const StudyPage = lazy(() => import('./pages/StudyPage').then((module) => ({ default: module.StudyPage })))
const FoodPage = lazy(() => import('./pages/FoodPage').then((module) => ({ default: module.FoodPage })))
const LifePage = lazy(() => import('./pages/LifePage').then((module) => ({ default: module.LifePage })))
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((module) => ({ default: module.ProgressPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const HealthPage = lazy(() => import('./pages/HealthPage').then((module) => ({ default: module.HealthPage })))

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <AppGate />
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function AppGate() {
  const auth = useAuth()

  if (auth.loading) return <LoadingSession />
  if (!auth.user && !auth.isDemo) return <AuthPage />
  if (auth.user) return <AuthenticatedGate key={auth.user.id} userId={auth.user.id} />
  return <MainApp dataKey="demo" />
}

function AuthenticatedGate({ userId }: { userId: string }) {
  const auth = useAuth()
  const [onboarded, setOnboarded] = useState<boolean | null>(null)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    if (!supabase) return

    let cancelled = false
    void supabase.from('profiles').select('onboarding_completed').eq('user_id', userId).maybeSingle().then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setSetupError('Dayframe cannot reach its database tables. Apply the included Supabase migration, then reload this page.')
        return
      }
      setOnboarded(Boolean(data?.onboarding_completed))
    })
    return () => { cancelled = true }
  }, [userId])

  if (onboarded === null && !setupError) return <LoadingSession />
  if (setupError) return (
    <main className="auth-page">
      <div style={{ width: '100%', maxWidth: 520, margin: 'auto' }}>
        <div style={{ marginBottom: 24 }}><Brand /></div>
        <section className="card card-pad">
          <p className="eyebrow">Setup required</p>
          <h1 style={{ fontSize: 32 }}>Connect the database.</h1>
          <p className="muted">{setupError}</p>
          <div className="row" style={{ marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>Retry</button>
            <button className="btn btn-secondary" type="button" onClick={() => void auth.signOut()}>Sign out</button>
          </div>
        </section>
      </div>
    </main>
  )
  if (!onboarded) return <OnboardingPage onComplete={() => setOnboarded(true)} />

  return <MainApp dataKey={userId} />
}

function LoadingSession() {
  return <main className="auth-page"><div style={{ margin: 'auto', textAlign: 'center' }}><LoaderCircle className="animate-spin" size={28} /><p className="muted small" style={{ marginTop: 12 }}>Restoring your secure session…</p></div></main>
}

function MainApp({ dataKey }: { dataKey: string }) {
  return (
    <DataProvider key={dataKey}>
      <AppShell>
        <Suspense fallback={<div className="skeleton" aria-label="Loading page" />}>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/train" element={<TrainPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/nutrition" element={<FoodPage />} />
            <Route path="/food" element={<Navigate to="/nutrition" replace />} />
            <Route path="/life" element={<LifePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/insights" element={<Navigate to="/progress" replace />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </DataProvider>
  )
}
