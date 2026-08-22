import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react'
import { Brand } from '../components/Brand'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface OnboardingPageProps { onComplete: () => void }

const steps = ['Profile', 'Targets', 'Schedule', 'Import']

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', units: 'metric', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, height: '', weight: '', calories: '', protein: '', trainingGoal: 'Build strength and consistency', sessions: '3' })
  const { user } = useAuth()

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const finish = async (event: FormEvent) => {
    event.preventDefault()
    if (supabase && user) {
      await supabase.from('profiles').upsert({ id: user.id, user_id: user.id, display_name: form.name, timezone: form.timezone, preferred_units: form.units, onboarding_completed: true })
      if (form.calories || form.protein) await supabase.from('user_preferences').upsert({ user_id: user.id, calorie_target: Number(form.calories) || null, protein_target_g: Number(form.protein) || null })
    }
    localStorage.setItem(`dayframe_onboarded_${user?.id ?? 'demo'}`, 'true')
    onComplete()
  }

  return (
    <main className="auth-page">
      <div style={{ width: '100%', maxWidth: 680, margin: 'auto' }}>
        <div style={{ marginBottom: 24 }}><Brand /></div>
        <section className="card card-pad" style={{ padding: 'clamp(22px, 6vw, 42px)' }}>
          <div className="row-between">
            <div><p className="eyebrow">First-time setup</p><h1 style={{ fontSize: 34 }}>Make Dayframe yours.</h1></div>
            <span className="badge">{step + 1} / {steps.length}</span>
          </div>
          <div className="row" style={{ margin: '24px 0' }}>{steps.map((name, index) => <div key={name} style={{ flex: 1 }}><div className="progress-track"><div className="progress-fill" style={{ width: index <= step ? '100%' : '0%' }} /></div><span className="tiny muted">{name}</span></div>)}</div>

          <form className="form-grid" onSubmit={step === steps.length - 1 ? finish : (event) => { event.preventDefault(); setStep((value) => value + 1) }}>
            {step === 0 && <>
              <label className="field"><span>Your name</span><input className="input" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="How should we greet you?" required /></label>
              <div className="grid-2"><label className="field"><span>Preferred units</span><select className="select" value={form.units} onChange={(event) => update('units', event.target.value)}><option value="metric">Metric (kg, cm)</option><option value="imperial">Imperial (lb, in)</option></select></label><label className="field"><span>Timezone</span><input className="input" value={form.timezone} onChange={(event) => update('timezone', event.target.value)} /></label></div>
              <div className="grid-2"><label className="field"><span>Height (optional)</span><input className="input" type="number" value={form.height} onChange={(event) => update('height', event.target.value)} placeholder="cm" /></label><label className="field"><span>Current weight (optional)</span><input className="input" type="number" step="0.1" value={form.weight} onChange={(event) => update('weight', event.target.value)} placeholder="kg" /></label></div>
            </>}
            {step === 1 && <>
              <p className="muted small">These targets are guides, not pass/fail rules. You can change them anytime.</p>
              <div className="grid-2"><label className="field"><span>Daily calories</span><input className="input" type="number" value={form.calories} onChange={(event) => update('calories', event.target.value)} placeholder="e.g. 2200" /></label><label className="field"><span>Daily protein (g)</span><input className="input" type="number" value={form.protein} onChange={(event) => update('protein', event.target.value)} placeholder="e.g. 130" /></label></div>
              <label className="field"><span>Training goal</span><select className="select" value={form.trainingGoal} onChange={(event) => update('trainingGoal', event.target.value)}><option>Build strength and consistency</option><option>Body recomposition</option><option>Build muscle</option><option>General health</option><option>Improve endurance</option></select></label>
            </>}
            {step === 2 && <>
              <label className="field"><span>Training days per week</span><select className="select" value={form.sessions} onChange={(event) => update('sessions', event.target.value)}>{[1,2,3,4,5,6].map((value) => <option key={value}>{value}</option>)}</select></label>
              <div className="card card-quiet card-pad"><strong>Start with a clean account</strong><p className="muted small" style={{ margin: '6px 0 0' }}>Nothing from another person is copied automatically. You can create a custom plan or explicitly copy a shared template after setup.</p></div>
            </>}
            {step === 3 && <>
              <div className="empty-state card card-quiet"><Upload size={28} style={{ margin: '0 auto 10px' }} /><strong>Import existing data</strong><p className="small">Optional JSON import is available in Settings after setup. Private files remain on your device until you confirm the import.</p></div>
              <label className="row small"><input type="checkbox" required /> I understand Dayframe does not provide medical diagnosis.</label>
            </>}
            <div className="row-between" style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={17} /> Back</button>
              <button className="btn btn-primary" type="submit">{step === steps.length - 1 ? <><Check size={17} /> Finish setup</> : <>Continue <ArrowRight size={17} /></>}</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
