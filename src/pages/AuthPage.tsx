import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, LogIn, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

const credentialsSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
  confirmPassword: z.string().optional(),
})

type CredentialForm = z.infer<typeof credentialsSchema>
type AuthMode = 'sign-in' | 'sign-up'

export function AuthPage() {
  const auth = useAuth()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [message, setMessage] = useState('')
  const [providerLoading, setProviderLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, getValues, reset, setError, trigger, formState: { errors, isSubmitting } } = useForm<CredentialForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setMessage('')
    setShowPassword(false)
    reset({ email: getValues('email'), password: '', confirmPassword: '' })
  }

  const submitCredentials = handleSubmit(async ({ email, password, confirmPassword }) => {
    setMessage('')
    if (mode === 'sign-up' && password !== confirmPassword) {
      setError('confirmPassword', { message: 'Passwords do not match' })
      return
    }

    try {
      if (mode === 'sign-in') {
        await auth.signInWithPassword(email, password)
      } else {
        const { needsEmailVerification } = await auth.signUpWithPassword(email, password)
        if (needsEmailVerification) {
          setMessage('Account created. Check your inbox and verify your email before signing in.')
          reset({ email, password: '', confirmPassword: '' })
        } else {
          setMessage('Account created. You are now signed in.')
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to ${mode === 'sign-in' ? 'sign in' : 'create your account'}.`)
    }
  })

  const emailMagicLink = async () => {
    const emailIsValid = await trigger('email')
    if (!emailIsValid) return
    setMagicLinkLoading(true)
    setMessage('')
    try {
      await auth.signInWithEmail(getValues('email'))
      setMessage('Check your inbox for a secure sign-in link.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send sign-in link.')
    } finally {
      setMagicLinkLoading(false)
    }
  }

  const googleLogin = async () => {
    setProviderLoading(true)
    setMessage('')
    try { await auth.signInWithGoogle() } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start Google sign-in.')
      setProviderLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-wrap">
        <section className="auth-story">
          <div style={{ position: 'relative', zIndex: 1 }}><Brand /></div>
          <div className="auth-manifesto" style={{ position: 'relative', zIndex: 1 }}>
            <p className="eyebrow">Start here</p>
            <h1 aria-label="Build the body. Train the mind. Frame your life.">
              <span>Build the body.</span>
              <span>Train the mind.</span>
              <strong>Frame your life.</strong>
            </h1>
            <span className="editorial-rule" aria-hidden="true" />
            <p className="auth-deck">One private system for training, study, nutrition, recovery and the life around them.</p>
          </div>
          <div className="auth-footnote" style={{ position: 'relative', zIndex: 1 }}><span>YOUR DAY, IN ONE CLEAR FRAME</span><span>PRIVATE BY DESIGN</span></div>
        </section>

        <section className="card auth-panel">
          <div>
            <span className="icon-bubble"><LockKeyhole size={20} /></span>
            <h2 style={{ marginTop: 18 }}>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="muted small">{mode === 'sign-in' ? 'Sign in to securely access your Dayframe.' : 'Start with a private Dayframe that belongs only to you.'}</p>
          </div>

          <div className="auth-actions">
            {auth.isConfigured ? <>
              <div className="auth-mode-switch" role="tablist" aria-label="Account access">
                <button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'active' : ''} onClick={() => changeMode('sign-in')}>Sign in</button>
                <button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'active' : ''} onClick={() => changeMode('sign-up')}>Create account</button>
              </div>

              <form className="form-grid" onSubmit={submitCredentials} noValidate>
                <div className="field">
                  <label htmlFor="auth-email">Email address</label>
                  <div className="input-with-icon">
                    <Mail size={17} />
                    <input id="auth-email" className="input" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
                  </div>
                  {errors.email && <span className="field-error">{errors.email.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="auth-password">Password</label>
                  <div className="input-with-icon input-with-action">
                    <KeyRound size={17} />
                    <input id="auth-password" className="input" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} {...register('password')} />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password.message}</span>}
                </div>
                {mode === 'sign-up' && <div className="field">
                  <label htmlFor="auth-confirm-password">Confirm password</label>
                  <div className="input-with-icon">
                    <KeyRound size={17} />
                    <input id="auth-confirm-password" className="input" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" autoComplete="new-password" {...register('confirmPassword')} />
                  </div>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
                </div>}
                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              {mode === 'sign-in' && <button className="link-button auth-magic-link" type="button" onClick={emailMagicLink} disabled={magicLinkLoading}>
                {magicLinkLoading ? <LoaderCircle className="animate-spin" size={16} /> : <Mail size={16} />} Email me a sign-in link
              </button>}

              <div className="row"><span className="divider" style={{ flex: 1 }} /><span className="muted tiny">OR</span><span className="divider" style={{ flex: 1 }} /></div>
              <button className="btn btn-secondary" type="button" onClick={googleLogin} disabled={providerLoading}>
                {providerLoading ? <LoaderCircle className="animate-spin" size={18} /> : <LogIn size={18} />} Continue with Google
              </button>
            </> : (
              <div className="card card-quiet card-pad" style={{ background: 'var(--brand-soft)' }}>
                <strong>Supabase setup needed</strong>
                <p className="muted small" style={{ margin: '6px 0 0' }}>Add the two public environment values to enable secure sign-in. Setup steps are included in the README.</p>
              </div>
            )}

            <button className="btn btn-secondary" type="button" onClick={auth.enterDemo}>Explore the interactive demo <ArrowRight size={17} /></button>
            {message && <p className="small auth-message" role="status" aria-live="polite">{message}</p>}
          </div>
          <p className="muted tiny" style={{ margin: '22px 0 0' }}>Dayframe is not a medical diagnostic service. Your data remains isolated by database-level access policies.</p>
        </section>
      </div>
    </main>
  )
}
