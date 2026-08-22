import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Bell, ChevronRight, Database, Download, FileJson, FlaskConical, HelpCircle, LogOut, Moon, Palette, Shield, SlidersHorizontal, Trash2, Upload, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Sheet } from '../components/Sheet'
import { supabase } from '../lib/supabase'
import { resetDemoV2 } from '../repositories/v2Repository'
import { useNutritionPreferences } from '../hooks/useV2'
import { usePersonalization } from '../hooks/usePersonalization'
import { InterestPicker } from '../components/InterestPicker'

export function SettingsPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const data = useData()
  const nutritionPreferences = useNutritionPreferences()
  const personalization = usePersonalization()
  const [interests, setInterests] = useState(personalization.interests)
  const [dark, setDark] = useState(() => localStorage.getItem('dayframe_theme') !== 'light')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<Record<string, unknown> | null>(null)
  const [importing, setImporting] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [message, setMessage] = useState('')
  const [panel, setPanel] = useState<'profile' | 'personalization' | 'privacy' | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dayframe_theme', dark ? 'dark' : 'light')
  }, [dark])

  const exportJson = async () => {
    let payload: Record<string, unknown> = { exported_at: new Date().toISOString(), version: 2, daily: data.daily, meals: data.meals, reminders: data.reminders, goals: data.goals, travel_plans: data.trips, workout: data.workout }
    if (!auth.isDemo && supabase) {
      const client = supabase
      const results = await Promise.all(exportTables.map(async (table) => {
        let query = client.from(table).select('*')
        if (['study_topics','study_resources','study_tasks'].includes(table)) query = query.eq('is_system', false)
        const { data: rows, error } = await query
        if (error) throw error
        return [table, rows ?? []] as const
      }))
      payload = { exported_at: new Date().toISOString(), version: 2, ...Object.fromEntries(results) }
    }
    download(`dayframe-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json')
  }

  const exportCsv = async () => {
    const mealRows = !auth.isDemo && supabase ? (await supabase.from('meal_entries').select('name,meal_type,calories,protein_g,carbs_g,fat_g,source').order('entry_date')).data ?? [] : data.meals.map((item) => ({ name: item.name, meal_type: item.meal, calories: item.calories, protein_g: item.protein, carbs_g: item.carbs, fat_g: item.fat, source: item.source }))
    const rows = [['name', 'meal', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'source'], ...mealRows.map((item) => [item.name, item.meal_type, item.calories, item.protein_g, item.carbs_g, item.fat_g, item.source])]
    download('dayframe-meals.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv')
  }

  const importJson = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>
      if (!parsed.version) throw new Error('Missing import version')
      const rowCount = importTables.reduce((sum, table) => sum + (Array.isArray(parsed[table]) ? parsed[table].length : 0), 0)
      if (rowCount === 0 && !parsed.profile) throw new Error('No supported records')
      setPendingImport(parsed)
      setImportOpen(true)
    } catch {
      setMessage('That file is not a valid Dayframe JSON export.')
    }
  }

  const confirmImport = async () => {
    if (!pendingImport || !auth.user || !supabase) {
      setMessage('Connect and sign in with Supabase before importing private data.')
      return
    }
    setImporting(true)
    try {
      const profile = pendingImport.profile
      if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
        const values = profile as Record<string, unknown>
        await supabase.from('profiles').update({ display_name: values.display_name, timezone: values.timezone, preferred_units: values.preferred_units }).eq('user_id', auth.user.id)
      }
      for (const table of importTables) {
        const input = pendingImport[table]
        if (!Array.isArray(input) || input.length === 0) continue
        const rows = input.map((row) => ({ ...(row as Record<string, unknown>), user_id: auth.user!.id, ...(['study_topics','study_resources','study_tasks'].includes(table) ? { is_system: false } : {}) }))
        const { error } = await supabase.from(table).upsert(rows)
        if (error) throw error
      }
      setImportOpen(false)
      setPendingImport(null)
      setMessage('Private data imported successfully. Refreshing your account view…')
      window.setTimeout(() => window.location.reload(), 900)
    } catch (error) {
      setMessage(error instanceof Error ? `Import stopped: ${error.message}` : 'Import could not be completed.')
    } finally {
      setImporting(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteText !== 'DELETE') return
    if (auth.isDemo) {
      data.resetDemo()
      resetDemoV2()
      setMessage('Demo data reset.')
      setDeleteOpen(false)
      setDeleteText('')
      return
    }
    if (!supabase || !auth.user) { setMessage('Sign in again before deleting your account.'); return }
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase.rpc('delete_current_user')
    if (error) {
      const migrationMissing = error.code === 'PGRST202' || error.message.includes('delete_current_user')
      setDeleteError(migrationMissing ? 'Account deletion needs the latest Supabase migration. Apply 202608230001_secure_account_deletion.sql, then try again.' : `Account was not deleted: ${error.message}`)
      setDeleting(false)
      return
    }
    setDeleteOpen(false)
    setDeleteText('')
    await auth.signOut()
    navigate('/')
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!auth.user || !supabase) { setMessage('Sign in to update account settings.'); return }
    const values = new FormData(event.currentTarget)
    const profile = await supabase.from('profiles').update({ display_name: String(values.get('name')), timezone: String(values.get('timezone')), preferred_units: String(values.get('units')) }).eq('user_id', auth.user.id)
    const leetcodeUrl = String(values.get('leetcode') ?? nutritionPreferences.data?.leetcode_profile_url ?? '').trim()
    const preferences = await supabase.from('user_preferences').upsert(
      { user_id: auth.user.id, calorie_target: Number(values.get('calories')) || null, protein_target_g: Number(values.get('protein')) || null, fiber_target_g: Number(values.get('fiber')) || null, steps_target: Number(values.get('steps')) || null, hydration_target_ml: Number(values.get('water')) || null, leetcode_profile_url: leetcodeUrl || null },
      { onConflict: 'user_id' },
    )
    if (profile.error || preferences.error) { setMessage(profile.error?.message ?? preferences.error?.message ?? 'Settings could not be saved.'); return }
    await auth.updateUserMetadata({ full_name: String(values.get('name')) })
    setPanel(null); setMessage('Profile, units, timezone and targets saved.')
  }

  const savePersonalization = async () => {
    if (!interests.length) { setMessage('Choose at least one area.'); return }
    try { await personalization.saveInterests(interests); setPanel(null); setMessage('Dayframe’s priorities have been updated.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Personalization could not be saved.') }
  }

  const saveLeetcode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!auth.user || !supabase) { setMessage('Sign in to save a profile link.'); return }
    const url = String(new FormData(event.currentTarget).get('leetcode') ?? '').trim()
    if (url && !/^https:\/\/(www\.)?leetcode\.com\/u\/[A-Za-z0-9_-]+\/?$/.test(url)) { setMessage('Enter a public LeetCode profile URL such as https://leetcode.com/u/username/.'); return }
    const { error } = await supabase.from('user_preferences').upsert(
      { user_id: auth.user.id, leetcode_profile_url: url || null },
      { onConflict: 'user_id' },
    )
    if (error) { setMessage(error.message); return }
    setMessage('LeetCode profile link saved. Dayframe does not scrape or automatically sync it.')
  }

  return (
    <div className="page">
      <header className="page-header"><div className="row" style={{ alignItems: 'flex-start' }}><button className="btn btn-secondary btn-icon" type="button" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20} /></button><div><p className="eyebrow">Account</p><h1>Profile & settings</h1><p className="muted">Your preferences, privacy and data.</p></div></div></header>

      {auth.isDemo && <div className="insight-callout"><strong className="small">You’re exploring demo mode.</strong><p className="muted small" style={{ margin: '6px 0 12px' }}>Demo changes stay only in this browser and never sync to your private account.</p><button className="btn btn-primary btn-small" type="button" onClick={() => void auth.signOut()}>Create account or sign in</button></div>}
      {message && <div className="toast" role="status">{message}</div>}

      <div className="settings-grid section">
        <section className="card card-pad"><div className="row" style={{ marginBottom: 12 }}><span className="icon-bubble"><UserRound size={19} /></span><div><strong>{auth.user?.user_metadata.full_name ?? 'Demo profile'}</strong><div className="muted small">{auth.user?.email ?? 'Local preview account'}</div></div></div><button className="settings-row" type="button" onClick={() => setPanel('profile')}><span>Edit profile, targets, units & timezone</span><ChevronRight size={18} className="muted" /></button></section>

        <section className="card card-pad"><div className="row"><span className="icon-bubble"><SlidersHorizontal size={19} /></span><strong>Personalization</strong></div><p className="muted small">Controls what appears first on Today and in Quick Add.</p><button className="settings-row" type="button" onClick={() => { setInterests(personalization.interests); setPanel('personalization') }}><span>Edit interests and priorities</span><ChevronRight size={18} className="muted" /></button></section>

        <section className="card card-pad"><div className="row"><span className="icon-bubble"><Palette size={19} /></span><strong>Appearance & alerts</strong></div><button className="settings-row" type="button" onClick={() => setDark((value) => !value)}><span className="row"><Moon size={17} /> Dark mode</span><span className={`switch ${dark ? 'on' : ''}`} role="switch" aria-checked={dark}><span /></span></button><button className="settings-row" type="button" onClick={() => void ('Notification' in window ? Notification.requestPermission().then((value) => setMessage(`Browser notification permission: ${value}. Background delivery is not guaranteed.`)) : setMessage('This browser does not support notifications.'))}><span className="row"><Bell size={17} /> Request notification permission</span><span className="badge badge-neutral">Browser only</span></button></section>

        <section className="card card-pad"><div className="row"><span className="icon-bubble"><Database size={19} /></span><strong>Your data</strong></div><button className="settings-row" type="button" onClick={() => void exportJson()}><span className="row"><FileJson size={17} /> Export all V2 data as JSON</span><Download size={17} className="muted" /></button><button className="settings-row" type="button" onClick={() => void exportCsv()}><span className="row"><Download size={17} /> Export meals as CSV</span><ChevronRight size={17} className="muted" /></button><button className="settings-row" type="button" onClick={() => importRef.current?.click()}><span className="row"><Upload size={17} /> Import Dayframe JSON</span><ChevronRight size={17} className="muted" /></button><input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => void importJson(event.target.files?.[0])} /><button className="settings-row" type="button" onClick={() => navigate('/nutrition')}><span>Nutrition & daily summaries</span><ChevronRight size={17} className="muted" /></button><button className="settings-row" type="button" onClick={() => navigate('/health')}><span className="row"><FlaskConical size={17} /> Bloodwork & biomarkers</span><ChevronRight size={17} className="muted" /></button></section>

        <section className="card card-pad"><div className="row"><span className="icon-bubble"><Shield size={19} /></span><strong>Privacy & support</strong></div><button className="settings-row" type="button" onClick={() => setPanel('privacy')}><span className="row"><HelpCircle size={17} /> Privacy, help & limitations</span><ChevronRight size={17} className="muted" /></button></section>

        <section className="card card-pad"><button className="settings-row" type="button" onClick={() => void auth.signOut()}><span className="row"><LogOut size={17} /> {auth.isDemo ? 'Leave demo and sign in' : 'Sign out'}</span><ChevronRight size={17} className="muted" /></button><button className="settings-row" style={{ color: 'var(--danger)' }} type="button" onClick={() => { setDeleteError(''); setDeleteOpen(true) }}><span className="row"><Trash2 size={17} /> {auth.isDemo ? 'Reset demo data' : 'Delete account and data'}</span><ChevronRight size={17} /></button></section>
      </div>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title={auth.isDemo ? 'Reset demo data?' : 'Delete your account?'} description={auth.isDemo ? 'This returns the interactive preview to its starting state.' : 'This permanently removes your account and every user-owned row. This cannot be undone.'}>
        <div className="form-grid"><label className="field"><span>Type DELETE to confirm</span><input className="input" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} autoComplete="off" disabled={deleting} /></label>{deleteError&&<p className="field-error" role="alert">{deleteError}</p>}<button className="btn" style={{ color: 'white', background: 'var(--danger)' }} disabled={deleteText !== 'DELETE' || deleting} type="button" onClick={() => void deleteAccount()}><Trash2 size={17} /> {deleting ? 'Deleting account…' : `Confirm ${auth.isDemo ? 'reset' : 'deletion'}`}</button></div>
      </Sheet>
      <Sheet open={importOpen} onClose={() => setImportOpen(false)} title="Review private import" description="Only supported personal tables will be written, and every row is forced to your signed-in user ID.">
        <div className="form-grid">
          <div className="card card-quiet card-pad">{importTables.map((table) => { const count = Array.isArray(pendingImport?.[table]) ? pendingImport[table].length : 0; return count > 0 ? <div className="row-between small" key={table} style={{ padding: '5px 0' }}><span>{table.replaceAll('_', ' ')}</span><strong>{count}</strong></div> : null })}</div>
          <p className="muted small">Existing rows with matching IDs will be updated. This import is private, but it cannot be undone as one transaction; export your account first if it already contains data.</p>
          <button className="btn btn-primary" type="button" disabled={importing} onClick={() => void confirmImport()}>{importing ? 'Importing…' : 'Confirm private import'}</button>
        </div>
      </Sheet>
      <Sheet open={panel === 'profile'} onClose={() => setPanel(null)} title="Profile and targets" description="Nutrition and Today read these persisted preferences.">
        <form className="form-grid" onSubmit={saveProfile}><label className="field"><span>Display name</span><input className="input" name="name" defaultValue={auth.user?.user_metadata.full_name ?? ''} required /></label><div className="grid-2"><label className="field"><span>Units</span><select className="select" name="units"><option value="metric">Metric</option><option value="imperial">Imperial</option></select></label><label className="field"><span>Timezone</span><input className="input" name="timezone" defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} required /></label><label className="field"><span>Calories</span><input className="input" name="calories" type="number" min="0" defaultValue={nutritionPreferences.data?.calorie_target ?? ''} /></label><label className="field"><span>Protein (g)</span><input className="input" name="protein" type="number" min="0" defaultValue={nutritionPreferences.data?.protein_target_g ?? ''} /></label><label className="field"><span>Fiber (g)</span><input className="input" name="fiber" type="number" min="0" defaultValue={nutritionPreferences.data?.fiber_target_g ?? ''} /></label><label className="field"><span>Steps</span><input className="input" name="steps" type="number" min="0" defaultValue={nutritionPreferences.data?.steps_target ?? ''} /></label><label className="field"><span>Hydration (ml)</span><input className="input" name="water" type="number" min="0" defaultValue={nutritionPreferences.data?.hydration_target_ml ?? ''} /></label></div><button className="btn btn-primary">Save settings</button></form>
        <form className="form-grid section" onSubmit={saveLeetcode}><label className="field"><span>Public LeetCode profile URL (optional)</span><input className="input" name="leetcode" type="url" defaultValue={nutritionPreferences.data?.leetcode_profile_url ?? ''} placeholder="https://leetcode.com/u/username/" /></label><p className="tiny muted">Link only. Dayframe does not scrape or automatically synchronize LeetCode.</p><button className="btn btn-secondary">Save profile link</button></form>
      </Sheet>
      <Sheet open={panel === 'personalization'} onClose={() => setPanel(null)} title="Your Dayframe priorities" description="Choose what matters now. Every section remains available from navigation."><div className="form-grid"><InterestPicker value={interests} onChange={setInterests}/><button className="btn btn-primary" type="button" disabled={!interests.length} onClick={() => void savePersonalization()}>Save priorities</button></div></Sheet>
      <Sheet open={panel === 'privacy'} onClose={() => setPanel(null)} title="Privacy and limitations" description="Dayframe keeps authority in the database, not the interface."><div className="form-grid"><p className="small">Personal rows are protected by owner-only Row Level Security. Demo data never enters an authenticated account. Browser code receives only the publishable Supabase key.</p><p className="small">Dayframe is not a diagnostic service. Screenshot and document extraction remain unavailable until a secure server provider is configured. Browser notifications cannot guarantee background delivery.</p><button className="btn btn-secondary" type="button" onClick={() => setPanel(null)}>Close</button></div></Sheet>
    </div>
  )
}

const exportTables = ['profiles','user_preferences','workout_programs','workout_program_days','program_exercises','exercise_substitutions','workout_sessions','exercise_logs','set_logs','foods','recipes','recipe_ingredients','meal_entries','activity_logs','body_measurements','sleep_logs','recovery_logs','pain_logs','supplements','supplement_logs','lab_results','goals','wishes','travel_plans','travel_items','projects','notes','reminders','plans','plan_phases','plan_blocks','planned_sessions','planned_items','plan_milestones','study_topics','study_resources','study_tasks','study_sessions','study_attempts','study_notes','study_reviews','daily_nutrition_summaries','import_jobs']
const importTables = ['body_measurements','lab_results','meal_entries','activity_logs','pain_logs','goals','travel_plans','notes','plans','plan_phases','plan_blocks','planned_sessions','planned_items','plan_milestones','study_topics','study_resources','study_tasks','study_sessions','study_attempts','study_notes','study_reviews','daily_nutrition_summaries']

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
