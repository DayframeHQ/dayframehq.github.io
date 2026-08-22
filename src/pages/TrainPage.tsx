import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Clock3, Dumbbell, History, Pause, Play, Plus, Repeat2, RotateCcw, Sparkles, TimerReset, TrendingUp } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const week = [
  { day: 'Tue', name: 'Upper A', focus: 'Back', status: 'done' },
  { day: 'Thu', name: 'Lower A', focus: 'Quads', status: 'done' },
  { day: 'Sat', name: 'Upper B', focus: 'Push', status: 'next' },
  { day: 'Sun', name: 'Lower B', focus: 'Core', status: 'upcoming' },
]

export function TrainPage() {
  const { workout, updateSet, copyStarterTemplate, saveWorkout } = useData()
  const auth = useAuth()
  const [active, setActive] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [rest, setRest] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const displayWeek = auth.isDemo ? week : week.map((item) => ({ ...item, status: 'upcoming' }))

  const totalSets = workout.reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const completedSets = workout.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)
  const percent = totalSets ? Math.round((completedSets / totalSets) * 100) : 0

  useEffect(() => {
    if (!active || completed) return
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [active, completed])

  useEffect(() => {
    if (!timerRunning || rest <= 0) return
    const id = window.setInterval(() => setRest((value) => {
      if (value <= 1) { setTimerRunning(false); return 0 }
      return value - 1
    }), 1000)
    return () => window.clearInterval(id)
  }, [rest, timerRunning])

  const formatTimer = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  const toggleSet = (exerciseId: string, setId: string, checked: boolean) => {
    updateSet(exerciseId, setId, 'completed', checked)
    if (checked) { setRest(90); setTimerRunning(true) }
  }

  const volume = useMemo(() => workout.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).reduce((sum, set) => sum + set.weight * set.reps, 0), 0), [workout])

  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">Training</p><h1>Strong, one set at a time.</h1><p className="muted">Your program, history and progression in one place.</p></div>
        <button className="btn btn-secondary btn-icon" type="button" aria-label="Workout history"><History size={20} /></button>
      </header>

      {!active && <>
        <section className="card today-hero">
          <div className="row-between"><span className="badge" style={{ color: '#F5F0E7', background: 'rgba(245,240,231,.12)' }}>4-Day Recomp</span><span className="muted small">Week 6</span></div>
          <div className="hero-workout"><div><p className="muted small" style={{ marginBottom: 5 }}>{workout.length ? 'Up next' : 'Available template'}</p><h2>Upper B · Push emphasis</h2><p className="muted small" style={{ margin: 0 }}>4 primary movements · 12 working sets</p></div><button className="btn btn-primary" type="button" onClick={() => workout.length ? setActive(true) : copyStarterTemplate()}>{workout.length ? <><Play size={17} fill="currentColor" /> Start</> : <><Plus size={17} /> Copy template</>}</button></div>
        </section>

        <section className="section">
          <div className="section-title"><h2>This week</h2><span className="badge">{auth.isDemo ? '2' : '0'} of 4 complete</span></div>
          <div className="card card-pad">
            {displayWeek.map((item) => <div className="row-between" key={item.day} style={{ padding: '11px 0' }}><div className="row"><span className="icon-bubble" style={{ width: 36, height: 36, color: item.status === 'done' ? 'white' : undefined, background: item.status === 'done' ? 'var(--brand)' : undefined }}>{item.status === 'done' ? <Check size={16} /> : <Dumbbell size={16} />}</span><div><strong className="small">{item.name}</strong><div className="muted tiny">{item.focus} emphasis</div></div></div><div style={{ textAlign: 'right' }}><strong className="small">{item.day}</strong><div className="muted tiny">{item.status === 'next' ? 'Up next' : item.status}</div></div></div>)}
          </div>
        </section>

        <div className="grid-3 section">
          <article className="card card-pad"><span className="icon-bubble"><TrendingUp size={19} /></span><span className="metric-value" style={{ marginTop: 14 }}>{auth.isDemo ? '88%' : '—'}</span><span className="metric-label">4-week adherence</span></article>
          <article className="card card-pad"><span className="icon-bubble"><Dumbbell size={19} /></span><span className="metric-value" style={{ marginTop: 14 }}>{auth.isDemo ? '42' : '0'}</span><span className="metric-label">hard sets this week</span></article>
          <article className="card card-pad"><span className="icon-bubble"><Sparkles size={19} /></span><span className="metric-value" style={{ marginTop: 14 }}>{auth.isDemo ? '3' : '0'}</span><span className="metric-label">recent rep PRs</span></article>
        </div>

        <section className="section"><div className="section-title"><h2>Your programs</h2><button className="link-button small" type="button"><Plus size={14} style={{ verticalAlign: -2 }} /> New program</button></div><article className="card card-pad row-between"><div><span className="badge">Active</span><h3 style={{ marginTop: 12 }}>4-Day Recomp — Upper/Lower</h3><p className="muted small" style={{ margin: 0 }}>4 days · 30 programmed exercises</p></div><ChevronDown className="muted" /></article></section>
      </>}

      {active && <>
        <div className="rest-timer">
          <div className="row"><Clock3 size={19} /><div><strong>{rest > 0 ? `Rest ${formatTimer(rest)}` : `Session ${formatTimer(elapsed)}`}</strong><div className="tiny" style={{ opacity: .7 }}>{rest > 0 ? 'Next set when ready' : `${completedSets} of ${totalSets} sets complete`}</div></div></div>
          <div className="row" style={{ gap: 4 }}>{rest > 0 && <><button className="btn btn-ghost btn-icon" style={{ color: 'inherit' }} type="button" onClick={() => setTimerRunning((value) => !value)} aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}>{timerRunning ? <Pause size={17} /> : <Play size={17} />}</button><button className="btn btn-ghost btn-icon" style={{ color: 'inherit' }} type="button" onClick={() => { setRest(90); setTimerRunning(true) }} aria-label="Reset timer"><RotateCcw size={17} /></button></>}</div>
        </div>
        <div className="row-between" style={{ marginBottom: 16 }}><div><p className="eyebrow">Active workout</p><h1 style={{ fontSize: 31 }}>Upper B</h1></div><div style={{ textAlign: 'right' }}><strong>{percent}%</strong><div className="muted tiny">{completedSets}/{totalSets} sets</div></div></div>
        <div className="progress-track" style={{ marginBottom: 22 }}><div className="progress-fill" style={{ width: `${percent}%` }} /></div>

        <div style={{ display: 'grid', gap: 14 }}>
          {workout.map((exercise, exerciseIndex) => <article className="card workout-card" key={exercise.id}>
            <div className="row-between"><div><span className="muted tiny">{exerciseIndex + 1} · {exercise.repRange}</span><h2 style={{ margin: '4px 0' }}>{exercise.name}</h2><p className="muted tiny" style={{ margin: 0 }}>Last: {exercise.previous}</p></div><button className="btn btn-ghost btn-icon" type="button" title="Substitute exercise" aria-label={`Substitute ${exercise.name}`}><Repeat2 size={18} /></button></div>
            <table className="set-table">
              <thead><tr><th>Set</th><th>kg</th><th>Reps</th><th>RIR</th><th>Done</th></tr></thead>
              <tbody>{exercise.sets.map((set, index) => <tr key={set.id}>
                <td className="set-number">{index + 1}</td>
                <td><input className="set-input" type="number" step="0.5" aria-label={`${exercise.name} set ${index + 1} weight`} value={set.weight} onChange={(event) => updateSet(exercise.id, set.id, 'weight', Number(event.target.value))} /></td>
                <td><input className="set-input" type="number" min="0" aria-label={`${exercise.name} set ${index + 1} reps`} value={set.reps || ''} placeholder="—" onChange={(event) => updateSet(exercise.id, set.id, 'reps', Number(event.target.value))} /></td>
                <td><input className="set-input" type="number" min="0" max="5" aria-label={`${exercise.name} set ${index + 1} RIR`} value={set.rir} onChange={(event) => updateSet(exercise.id, set.id, 'rir', Number(event.target.value))} /></td>
                <td><button className={`check ${set.completed ? 'checked' : ''}`} type="button" onClick={() => toggleSet(exercise.id, set.id, !set.completed)} aria-label={`Mark ${exercise.name} set ${index + 1} ${set.completed ? 'incomplete' : 'complete'}`}>{set.completed && <Check size={15} />}</button></td>
              </tr>)}</tbody>
            </table>
            {exercise.sets.every((set) => set.completed && set.reps >= 10 && set.rir >= 1) && <div className="insight-callout small"><Sparkles size={15} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} />You reached the top of the rep range with reps in reserve. Consider a small load increase next time — confirm before changing the plan.</div>}
          </article>)}
        </div>

        <section className="card card-pad section">
          <div className="row-between"><div><span className="muted tiny">Session volume</span><div className="metric-value">{Math.round(volume).toLocaleString()} kg</div></div><TimerReset size={24} className="muted" /></div>
          {!completed ? <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} type="button" disabled={completedSets === 0 || saving} onClick={() => { setSaving(true); setSaveError(''); void saveWorkout().then(() => setCompleted(true)).catch(() => setSaveError('Could not sync this workout yet. Your entries remain on this device.')).finally(() => setSaving(false)) }}><Check size={17} /> {saving ? 'Saving…' : 'Finish workout'}</button> : <div className="insight-callout" style={{ marginTop: 18 }}><strong>Workout complete.</strong><p className="small" style={{ margin: '5px 0 0' }}>Nice work. Your completed sets are saved.</p></div>}
          {saveError && <p className="small" role="alert" style={{ color: 'var(--danger)', margin: '10px 0 0' }}>{saveError}</p>}
        </section>
      </>}
    </div>
  )
}
