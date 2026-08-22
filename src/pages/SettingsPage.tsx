import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bell, ChevronRight, Database, Download, FileJson, FlaskConical, HelpCircle, LogOut, Moon, Palette, Shield, Trash2, Upload, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Sheet } from '../components/Sheet'
import { supabase } from '../lib/supabase'

export function SettingsPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const data = useData()
  const [dark, setDark] = useState(() => localStorage.getItem('dayframe_theme') === 'dark')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [message, setMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dayframe_theme', dark ? 'dark' : 'light')
  }, [dark])

  const exportJson = () => {
    const payload = { exported_at: new Date().toISOString(), version: 1, daily: data.daily, meals: data.meals, reminders: data.reminders, goals: data.goals, travel_plans: data.trips, workout: data.workout }
    download(`dayframe-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json')
  }

  const exportCsv = () => {
    const rows = [['name', 'meal', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'source'], ...data.meals.map((item) => [item.name, item.meal, item.calories, item.protein, item.carbs, item.fat, item.source])]
    download('dayframe-meals.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv')
  }

  const importJson = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>
      if (!parsed.version) throw new Error('Missing import version')
      setMessage('Import file validated. Database import is available when Supabase is connected.')
    } catch {
      setMessage('That file is not a valid Dayframe JSON export.')
    }
  }

  const deleteAccount = async () => {
    if (deleteText !== 'DELETE') return
    if (auth.isDemo) {
      data.resetDemo()
      setMessage('Demo data reset.')
      setDeleteOpen(false)
      setDeleteText('')
      return
    }
    if (supabase) {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
      if (error) { setMessage('Account deletion function is not configured yet. See Supabase setup in README.'); return }
      await auth.signOut()
    }
  }

  return (
    <div className="page">
      <header className="page-header"><div className="row" style={{ alignItems: 'flex-start' }}><button className="btn btn-secondary btn-icon" type="button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button><div><p className="eyebrow">Account</p><h1>Profile & settings</h1><p className="muted">Your preferences, privacy and data.</p></div></div></header>

      {auth.isDemo && <div className="insight-callout"><strong className="small">You’re exploring demo mode.</strong><p className="muted small" style={{ margin: '6px 0 0' }}>Changes are saved only in this browser. Connect Supabase to create secure synced accounts.</p></div>}
      {message && <div className="toast" role="status">{message}</div>}

      <div className="settings-grid section">
        <section className="card card-pad"><div className="row" style={{ marginBottom: 12 }}><span className="icon-bubble"><UserRound size={19} /></span><div><strong>{auth.user?.user_metadata.full_name ?? 'Demo profile'}</strong><div className="muted small">{auth.user?.email ?? 'Local preview account'}</div></div></div><button className="settings-row" type="button"><span>Edit profile and targets</span><ChevronRight size={18} className="muted" /></button><button className="settings-row" type="button"><span>Units, timezone & schedule</span><ChevronRight size={18} className="muted" /></button></section>

        <section className="card card-pad"><div className="row"><span className="icon-bubble"><Palette size={19} /></span><strong>Appearance & alerts</strong></div><button className="settings-row" type="button" onClick={() => setDark((value) => !value)}><span className="row"><Moon size={17} /> Dark mode</span><span className={`switch ${dark ? 'on' : ''}`} role="switch" aria-checked={dark}><span /></span></button><button className="settings-row" type="button"><span className="row"><Bell size={17} /> Notification permission</span><span className="badge badge-neutral">Browser only</span></button></section>

        <section className="card card-pad"><div className="row"><span className="icon-bubble"><Database size={19} /></span><strong>Your data</strong></div><button className="settings-row" type="button" onClick={exportJson}><span className="row"><FileJson size={17} /> Export all data as JSON</span><Download size={17} className="muted" /></button><button className="settings-row" type="button" onClick={exportCsv}><span className="row"><Download size={17} /> Export meals as CSV</span><ChevronRight size={17} className="muted" /></button><button className="settings-row" type="button" onClick={() => importRef.current?.click()}><span className="row"><Upload size={17} /> Import Dayframe JSON</span><ChevronRight size={17} className="muted" /></button><input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => void importJson(event.target.files?.[0])} /><button className="settings-row" type="button" onClick={() => navigate('/health')}><span className="row"><FlaskConical size={17} /> Bloodwork & biomarkers</span><ChevronRight size={17} className="muted" /></button></section>

        <section className="card card-pad"><div className="row"><span className="icon-bubble"><Shield size={19} /></span><strong>Privacy & support</strong></div><button className="settings-row" type="button"><span>Privacy model</span><ChevronRight size={17} className="muted" /></button><button className="settings-row" type="button"><span className="row"><HelpCircle size={17} /> Help & current limitations</span><ChevronRight size={17} className="muted" /></button></section>

        <section className="card card-pad"><button className="settings-row" type="button" onClick={() => void auth.signOut()}><span className="row"><LogOut size={17} /> Sign out</span><ChevronRight size={17} className="muted" /></button><button className="settings-row" style={{ color: 'var(--danger)' }} type="button" onClick={() => setDeleteOpen(true)}><span className="row"><Trash2 size={17} /> {auth.isDemo ? 'Reset demo data' : 'Delete account and data'}</span><ChevronRight size={17} /></button></section>
      </div>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title={auth.isDemo ? 'Reset demo data?' : 'Delete your account?'} description={auth.isDemo ? 'This returns the interactive preview to its starting state.' : 'This permanently removes your account and every user-owned row. This cannot be undone.'}>
        <div className="form-grid"><label className="field"><span>Type DELETE to confirm</span><input className="input" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} autoComplete="off" /></label><button className="btn" style={{ color: 'white', background: 'var(--danger)' }} disabled={deleteText !== 'DELETE'} type="button" onClick={() => void deleteAccount()}><Trash2 size={17} /> Confirm {auth.isDemo ? 'reset' : 'deletion'}</button></div>
      </Sheet>
    </div>
  )
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}
