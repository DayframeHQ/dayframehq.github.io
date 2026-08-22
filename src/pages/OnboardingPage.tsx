import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Brand } from '../components/Brand'
import { InterestPicker } from '../components/InterestPicker'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { DayframeInterest } from '../lib/personalization'

interface OnboardingPageProps { onComplete: () => void }

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const auth = useAuth()
  const suggestedName = String(auth.user?.user_metadata.full_name ?? auth.user?.user_metadata.name ?? auth.user?.email?.split('@')[0] ?? '')
  const [name, setName] = useState(suggestedName)
  const [interests, setInterests] = useState<DayframeInterest[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const finish = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase || !auth.user || interests.length === 0) return
    setSaving(true)
    setSaveError('')
    try {
      await auth.updateUserMetadata({ full_name: name.trim(), dayframe_interests: interests, dayframe_onboarding_version: 2 })
      const { error } = await supabase.from('profiles').upsert({ id: auth.user.id, user_id: auth.user.id, display_name: name.trim(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, onboarding_completed: true }, { onConflict: 'user_id' })
      if (error) throw error
      onComplete()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Your setup could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="auth-page"><div style={{ width: '100%', maxWidth: 760, margin: 'auto' }}>
    <div style={{ marginBottom: 24 }}><Brand /></div>
    <section className="card card-pad onboarding-card">
      <p className="eyebrow">A lighter start</p><h1>What should Dayframe help you move forward?</h1>
      <p className="muted">We’ll ask for useful details only when you open that part of the app. No irrelevant fitness or study questionnaire now.</p>
      <form className="form-grid section" onSubmit={finish}>
        <label className="field"><span>Your name</span><input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we greet you?" autoComplete="name" required /></label>
        <fieldset className="interest-fieldset"><legend>What brings you here?</legend><p className="tiny muted">Choose one or more. This sets the order of Today and Quick Add.</p><InterestPicker value={interests} onChange={setInterests}/></fieldset>
        {saveError && <p className="auth-message small" role="alert">Could not save your setup: {saveError}</p>}
        <div className="row-between onboarding-actions"><span className="tiny muted">You can change this anytime in Settings.</span><button className="btn btn-primary" type="submit" disabled={saving || interests.length === 0}>{saving ? 'Preparing Dayframe…' : <>Enter Dayframe <ArrowRight size={17}/></>}</button></div>
      </form>
    </section>
  </div></main>
}
