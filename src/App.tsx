import { lazy, Suspense, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthProvider'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataProvider'
import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'

const TodayPage = lazy(() => import('./pages/TodayPage').then((module) => ({ default: module.TodayPage })))
const TrainPage = lazy(() => import('./pages/TrainPage').then((module) => ({ default: module.TrainPage })))
const FoodPage = lazy(() => import('./pages/FoodPage').then((module) => ({ default: module.FoodPage })))
const LifePage = lazy(() => import('./pages/LifePage').then((module) => ({ default: module.LifePage })))
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((module) => ({ default: module.InsightsPage })))
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
  const onboardKey = `dayframe_onboarded_${auth.user?.id ?? 'demo'}`
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(onboardKey) === 'true')

  if (auth.loading) return <main className="auth-page"><div style={{ margin: 'auto', textAlign: 'center' }}><LoaderCircle className="animate-spin" size={28} /><p className="muted small" style={{ marginTop: 12 }}>Restoring your secure session…</p></div></main>
  if (!auth.user && !auth.isDemo) return <AuthPage />
  if (auth.user && !onboarded) return <OnboardingPage onComplete={() => setOnboarded(true)} />

  return (
    <DataProvider>
      <AppShell>
        <Suspense fallback={<div className="skeleton" aria-label="Loading page" />}>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/train" element={<TrainPage />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/life" element={<LifePage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </DataProvider>
  )
}
