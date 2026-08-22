import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from './AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [isDemo, setIsDemo] = useState(() => sessionStorage.getItem('dayframe_demo') === 'true')

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    isDemo,
    isConfigured: isSupabaseConfigured,
    enterDemo: () => {
      sessionStorage.setItem('dayframe_demo', 'true')
      setIsDemo(true)
    },
    signInWithGoogle: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
      })
      if (error) throw error
    },
    signInWithEmail: async (email: string) => {
      if (!supabase) return
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
          shouldCreateUser: false,
        },
      })
      if (error) throw error
    },
    signInWithPassword: async (email: string, password: string) => {
      if (!supabase) return
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    signUpWithPassword: async (email: string, password: string) => {
      if (!supabase) return { needsEmailVerification: false }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
      })
      if (error) throw error
      return { needsEmailVerification: data.session === null }
    },
    signOut: async () => {
      sessionStorage.removeItem('dayframe_demo')
      setIsDemo(false)
      if (supabase) await supabase.auth.signOut()
    },
  }), [isDemo, loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
