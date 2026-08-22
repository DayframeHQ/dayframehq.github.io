import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Beaker, Plus, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Sheet } from '../components/Sheet'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { usePersonalization } from '../hooks/usePersonalization'

interface LabResult { id: string; test: string; category: string; date: string; result: number; unit: string; lower?: number; upper?: number; provider?: string; notes?: string }

const demoLabs: LabResult[] = [
  { id: 'l1', test: 'Vitamin D', category: 'Vitamins', date: '2026-03-12', result: 31, unit: 'ng/mL', lower: 30, upper: 100 },
  { id: 'l2', test: 'Vitamin D', category: 'Vitamins', date: '2026-07-18', result: 38, unit: 'ng/mL', lower: 30, upper: 100 },
]

export function HealthPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const personalization = usePersonalization()
  const [labs, setLabs] = useState<LabResult[]>(() => auth.isDemo ? demoLabs : [])
  const [open, setOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState(auth.isDemo ? 'Vitamin D' : '')
  const testNames = [...new Set(labs.map((item) => item.test))]
  const selected = useMemo(() => labs.filter((item) => item.test === selectedTest).sort((a, b) => a.date.localeCompare(b.date)), [labs, selectedTest])

  useEffect(() => {
    if (auth.isDemo || !supabase) return
    void supabase.from('lab_results').select('*').order('collection_date').then(({ data }) => {
      const items = (data ?? []).map((item) => ({ id: item.id, test: item.test_name, category: item.category ?? '', date: item.collection_date, result: Number(item.result), unit: item.unit, lower: item.reference_lower ? Number(item.reference_lower) : undefined, upper: item.reference_upper ? Number(item.reference_upper) : undefined, provider: item.provider ?? undefined, notes: item.notes ?? undefined }))
      setLabs(items)
      if (items[0]) setSelectedTest(items[0].test)
    })
  }, [auth.isDemo])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const next: LabResult = { id: crypto.randomUUID(), test: String(values.test), category: String(values.category), date: String(values.date), result: Number(values.result), unit: String(values.unit), lower: values.lower ? Number(values.lower) : undefined, upper: values.upper ? Number(values.upper) : undefined, provider: String(values.provider || ''), notes: String(values.notes || '') }
    setLabs((items) => [...items, next])
    setSelectedTest(next.test)
    setOpen(false)
    if (!auth.isDemo && auth.user && supabase) void supabase.from('lab_results').insert({ id: next.id, user_id: auth.user.id, test_name: next.test, category: next.category, collection_date: next.date, result: next.result, unit: next.unit, reference_lower: next.lower, reference_upper: next.upper, provider: next.provider, notes: next.notes })
  }

  return (
    <div className="page">
      <header className="page-header"><div className="row" style={{ alignItems: 'flex-start' }}><button className="btn btn-secondary btn-icon" type="button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button><div><p className="eyebrow">Health</p><h1>Bloodwork & biomarkers</h1><p className="muted">Track results over time. Dayframe does not diagnose changes.</p></div></div><button className="btn btn-primary btn-icon" type="button" onClick={() => setOpen(true)} aria-label="Add lab result"><Plus size={20} /></button></header>

      {!personalization.getDomainSetup('health') && <HealthSetup/>}

      <div className="insight-callout"><div className="row"><ShieldCheck size={18} /><strong className="small">Private health data</strong></div><p className="muted small" style={{ margin: '7px 0 0' }}>Real entries are stored only in your authenticated Supabase account. The values shown in demo mode are fictional examples.</p></div>

      {labs.length > 0 ? <section className="card card-pad section">
        <div className="row-between"><div><h2 style={{ marginBottom: 4 }}>{selectedTest}</h2><span className="muted small">{selected.length} results over time</span></div><select className="select" aria-label="Select biomarker" value={selectedTest} onChange={(event) => setSelectedTest(event.target.value)} style={{ width: 'auto' }}>{testNames.map((name) => <option key={name}>{name}</option>)}</select></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={selected}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis domain={['dataMin - 5', 'dataMax + 5']} hide /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)' }} /><Line dataKey="result" stroke="var(--ink)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--ink)' }} /></LineChart></ResponsiveContainer></div>
      </section> : <section className="card card-pad section empty-state"><Beaker size={26} style={{ margin: '0 auto 10px' }} /><strong>No lab results yet.</strong><p className="small">Add a result manually when you’re ready. Nothing is prefilled for a new account.</p></section>}

      <section className="section"><div className="section-title"><h2>Recent results</h2><span className="badge badge-neutral">Manual entries</span></div><div className="card card-pad">{labs.slice().reverse().map((lab) => <div className="row-between" key={lab.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}><div className="row"><span className="icon-bubble"><Beaker size={17} /></span><div><strong className="small">{lab.test}</strong><div className="muted tiny">{lab.category} · {lab.date}</div></div></div><div style={{ textAlign: 'right' }}><strong>{lab.result} {lab.unit}</strong><div className="muted tiny">Reference: {lab.lower ?? '—'}–{lab.upper ?? '—'}</div></div></div>)}</div></section>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add lab result" description="Enter the result exactly as reported by the lab.">
        <form className="form-grid" onSubmit={submit}>
          <div className="grid-2"><label className="field"><span>Test name</span><input className="input" name="test" required /></label><label className="field"><span>Category</span><input className="input" name="category" placeholder="e.g. Lipids" required /></label></div>
          <div className="grid-2"><label className="field"><span>Collection date</span><input className="input" name="date" type="date" required /></label><label className="field"><span>Provider (optional)</span><input className="input" name="provider" /></label></div>
          <div className="grid-2"><label className="field"><span>Result</span><input className="input" name="result" type="number" step="any" required /></label><label className="field"><span>Unit</span><input className="input" name="unit" required /></label></div>
          <div className="grid-2"><label className="field"><span>Reference lower</span><input className="input" name="lower" type="number" step="any" /></label><label className="field"><span>Reference upper</span><input className="input" name="upper" type="number" step="any" /></label></div>
          <label className="field"><span>Notes</span><textarea className="textarea" name="notes" /></label>
          <button className="btn btn-primary" type="submit">Save result</button>
        </form>
      </Sheet>
    </div>
  )
}

function HealthSetup(){const personalization=usePersonalization();const[saving,setSaving]=useState(false);const[error,setError]=useState('');const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setSaving(true);setError('');const form=new FormData(event.currentTarget);try{await personalization.saveDomainSetup('health',{focus:String(form.get('focus'))})}catch(value){setError(value instanceof Error?value.message:'Health setup could not be saved.')}finally{setSaving(false)}};return <section className="card card-pad progressive-setup"><p className="eyebrow">Health setup · optional</p><h2>What context matters to you?</h2><p className="muted small">Dayframe tracks records and trends; it does not diagnose or replace medical care.</p><form className="form-grid section" onSubmit={submit}><label className="field"><span>Start with</span><select className="select" name="focus"><option>Bloodwork and biomarkers</option><option>Body measurements</option><option>Sleep and recovery</option><option>A broad health overview</option></select></label>{error&&<p className="field-error">{error}</p>}<div className="row progressive-actions"><button className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save preference'}</button><button className="btn btn-ghost" type="button" onClick={()=>void personalization.skipDomainSetup('health')}>Skip for now</button></div></form></section>}
