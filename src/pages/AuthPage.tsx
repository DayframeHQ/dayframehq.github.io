import { useState } from 'react'
import { ArrowRight, Check, LoaderCircle, LockKeyhole, LogIn, Mail, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

const emailSchema = z.object({ email: z.string().email('Enter a valid email address') })
type EmailForm = z.infer<typeof emailSchema>

export function AuthPage() {
  const auth = useAuth()
  const [message, setMessage] = useState('')
  const [providerLoading, setProviderLoading] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  const emailLogin = handleSubmit(async ({ email }) => {
    try {
      await auth.signInWithEmail(email)
      setMessage('Check your inbox for a secure sign-in link.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send sign-in link.')
    }
  })

  const googleLogin = async () => {
    setProviderLoading(true)
    try { await auth.signInWithGoogle() } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start Google sign-in.')
      setProviderLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-wrap">
        <section className="auth-story">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ filter: 'brightness(0) invert(1)', display: 'inline-block' }}><Brand /></div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="eyebrow" style={{ color: '#73dda0' }}>Your day, in one clear frame</p>
            <h1>Build a life you can actually see.</h1>
            <p>Training, nutrition, recovery and the things that matter beyond them — thoughtfully connected, never cluttered.</p>
            <div className="row" style={{ flexWrap: 'wrap', marginTop: 24 }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,.1)', color: 'white' }}><Check size={12} /> Private by design</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,.1)', color: 'white' }}><Sparkles size={12} /> Calm, useful insights</span>
            </div>
          </div>
        </section>

        <section className="card auth-panel">
          <div>
            <span className="icon-bubble"><LockKeyhole size={20} /></span>
            <h2 style={{ marginTop: 18 }}>Welcome to Dayframe</h2>
            <p className="muted small">Sign in to keep your personal data secure and synced across devices.</p>
          </div>

          <div className="auth-actions">
            {auth.isConfigured ? <>
              <button className="btn btn-secondary" type="button" onClick={googleLogin} disabled={providerLoading}>
                {providerLoading ? <LoaderCircle className="animate-spin" size={18} /> : <LogIn size={18} />} Continue with Google
              </button>
              <div className="row"><span className="divider" style={{ flex: 1 }} /><span className="muted tiny">OR</span><span className="divider" style={{ flex: 1 }} /></div>
              <form className="form-grid" onSubmit={emailLogin} noValidate>
                <label className="field">
                  <span>Email address</span>
                  <div style={{ position: 'relative' }}>
                    <Mail size={17} style={{ position: 'absolute', left: 13, top: 15, color: 'var(--muted)' }} />
                    <input className="input" style={{ paddingLeft: 40 }} type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
                  </div>
                  {errors.email && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.email.message}</span>}
                </label>
                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />} Email me a sign-in link</button>
              </form>
            </> : (
              <div className="card card-quiet card-pad" style={{ background: 'var(--brand-soft)' }}>
                <strong>Supabase setup needed</strong>
                <p className="muted small" style={{ margin: '6px 0 0' }}>Add the two public environment values to enable secure sign-in. Setup steps are included in the README.</p>
              </div>
            )}

            <button className="btn btn-secondary" type="button" onClick={auth.enterDemo}>Explore the interactive demo <ArrowRight size={17} /></button>
            {message && <p className="small" role="status" style={{ margin: '4px 0 0', color: 'var(--brand)' }}>{message}</p>}
          </div>
          <p className="muted tiny" style={{ margin: '22px 0 0' }}>Dayframe is not a medical diagnostic service. Your data remains isolated by database-level access policies.</p>
        </section>
      </div>
    </main>
  )
}
