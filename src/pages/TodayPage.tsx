import { addDays, format, isSameDay, startOfWeek, subDays } from 'date-fns'
import { Activity, ArrowRight, BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, CircleUserRound, Droplets, Dumbbell, Footprints, HeartPulse, Leaf, Moon, Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'

const schedules: Record<number, { name: string; detail: string }> = {
  2: { name: 'Upper A', detail: 'Back emphasis · 8 exercises' },
  4: { name: 'Lower A', detail: 'Quad emphasis · 6 exercises' },
  6: { name: 'Upper B', detail: 'Push emphasis · 9 exercises' },
  0: { name: 'Lower B + Core', detail: '7 exercises · 55–70 min' },
}

export function TodayPage() {
  const data = useData()
  const navigate = useNavigate()
  const date = data.selectedDate
  const schedule = data.workout.length ? schedules[date.getDay()] : undefined
  const totals = data.meals.reduce((sum, meal) => ({ calories: sum.calories + meal.calories, protein: sum.protein + meal.protein, carbs: sum.carbs + meal.carbs, fat: sum.fat + meal.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  const activeReminders = data.reminders.filter((item) => !item.completed)
  const completion = Math.round(([totals.protein >= 120, data.daily.steps >= 7000, data.daily.waterMl >= 1800, data.daily.sleepHours >= 7, activeReminders.length === 0].filter(Boolean).length / 5) * 100)
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{format(date, 'EEEE, MMMM d')}</p>
          <h1>{greeting()}, there.</h1>
          <p className="muted">Here’s the shape of your day.</p>
        </div>
        <button className="btn btn-secondary btn-icon" type="button" onClick={() => navigate('/settings')} aria-label="Open profile and settings"><CircleUserRound size={22} /></button>
      </header>

      <div className="row-between" style={{ marginBottom: 10 }}>
        <button className="btn btn-ghost btn-icon" type="button" onClick={() => data.setSelectedDate(subDays(date, 1))} aria-label="Previous day"><ChevronLeft /></button>
        <label className="btn btn-secondary" style={{ position: 'relative', cursor: 'pointer' }}><CalendarDays size={17} /><span>{isSameDay(date, new Date()) ? 'Today' : format(date, 'MMM d')}</span><input type="date" aria-label="Select date" value={format(date, 'yyyy-MM-dd')} onChange={(event) => data.setSelectedDate(new Date(`${event.target.value}T12:00:00`))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} /></label>
        <button className="btn btn-ghost btn-icon" type="button" onClick={() => data.setSelectedDate(addDays(date, 1))} aria-label="Next day"><ChevronRight /></button>
      </div>

      <div className="calendar-strip" aria-label="Week selector">
        {Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map((day) => <button key={day.toISOString()} className={`calendar-day ${isSameDay(day, date) ? 'active' : ''}`} type="button" onClick={() => data.setSelectedDate(day)}><span className="tiny">{format(day, 'EEE').slice(0, 2)}</span><strong>{format(day, 'd')}</strong></button>)}
      </div>

      <section className="card today-hero section">
        <div className="hero-top">
          <div>
            <span className="badge" style={{ color: '#F5F0E7', background: 'rgba(245,240,231,.12)' }}><Dumbbell size={12} /> Training</span>
            <p className="muted small" style={{ margin: '12px 0 0' }}>{schedule ? 'Scheduled today' : 'No resistance session scheduled'}</p>
          </div>
          <span className="tiny muted">{schedule ? '0% complete' : 'Recovery day'}</span>
        </div>
        <div className="hero-workout">
          <div><h2>{schedule?.name ?? 'Recovery day'}</h2><p className="muted small" style={{ margin: 0 }}>{schedule?.detail ?? 'Walk, recover and prepare for the next session'}</p></div>
          <button className="btn btn-primary" type="button" onClick={() => navigate('/train')}>{schedule ? 'Start' : 'View plan'} <ArrowRight size={17} /></button>
        </div>
      </section>

      <div className="grid-2 section">
        <section className="card card-pad">
          <div className="row-between"><div className="row"><span className="icon-bubble"><Leaf size={20} /></span><div><h2 style={{ margin: 0 }}>Nutrition</h2><span className="muted tiny">Today’s intake</span></div></div><button className="link-button small" type="button" onClick={() => navigate('/food')}>Details</button></div>
          <div style={{ marginTop: 20 }}><div className="row-between"><strong style={{ fontSize: 24 }}>{totals.calories.toLocaleString()} <span className="muted small">/ 2,200 kcal</span></strong><span className="badge">{Math.round((totals.calories / 2200) * 100)}%</span></div><div className="progress-track" style={{ marginTop: 10 }}><div className="progress-fill" style={{ width: `${Math.min(100, totals.calories / 22)}%` }} /></div></div>
          <div className="macro-row">
            <Macro label="Protein" value={totals.protein} target={140} />
            <Macro label="Carbs" value={totals.carbs} target={240} />
            <Macro label="Fat" value={totals.fat} target={70} />
            <Macro label="Fiber" value={22} target={30} />
          </div>
        </section>

        <section className="card card-pad">
          <div className="row"><span className="icon-bubble"><Activity size={20} /></span><div><h2 style={{ margin: 0 }}>Movement</h2><span className="muted tiny">Keep the day in motion</span></div></div>
          <div className="grid-3" style={{ marginTop: 22 }}>
            <Metric icon={<Footprints size={16} />} value={data.daily.steps.toLocaleString()} label="steps" />
            <Metric icon={<Activity size={16} />} value={`${data.daily.walkingMinutes}m`} label="walking" />
            <Metric icon={<Droplets size={16} />} value={`${(data.daily.waterMl / 1000).toFixed(1)}L`} label="water" />
          </div>
        </section>
      </div>

      <div className="grid-2 section">
        <section className="card card-pad">
          <div className="row-between"><div className="row"><span className="icon-bubble"><Moon size={20} /></span><div><h2 style={{ margin: 0 }}>Recovery</h2><span className="muted tiny">Your readiness signals</span></div></div><span className="badge">Steady</span></div>
          <div className="grid-3" style={{ marginTop: 20 }}>
            <Metric icon={<BedDouble size={16} />} value={`${data.daily.sleepHours}h`} label="sleep" />
            <Metric icon={<HeartPulse size={16} />} value={data.daily.pain ? `${data.daily.pain.score}/10` : '—'} label="pain" />
            <Metric icon={<Scale size={16} />} value={data.daily.weight ? `${data.daily.weight} kg` : '—'} label="weight" />
          </div>
          {data.daily.pain && data.daily.pain.score >= 5 && <div className="insight-callout small" style={{ marginTop: 16 }}>Pain is elevated today. Consider reducing or substituting movements that aggravate it. This is not a diagnosis.</div>}
        </section>

        <section className="card card-pad">
          <div className="row-between"><div><h2 style={{ marginBottom: 3 }}>Daily frame</h2><span className="muted tiny">A quiet progress summary</span></div><strong style={{ fontSize: 26 }}>{completion}%</strong></div>
          <div className="progress-track" style={{ margin: '18px 0 16px' }}><div className="progress-fill" style={{ width: `${completion}%` }} /></div>
          <p className="muted small" style={{ margin: 0 }}>{completion >= 80 ? 'The essentials are in place. Anything else is extra.' : 'A few useful anchors remain — no need for a perfect day.'}</p>
        </section>
      </div>

      <section className="section">
        <div className="section-title"><h2>Reminders</h2><button className="link-button small" type="button">View all</button></div>
        <div className="card card-pad">
          {data.reminders.length === 0 ? <div className="empty-state">Nothing due today. Your day is clear.</div> : data.reminders.map((reminder) => <div className="row-between" key={reminder.id} style={{ padding: '9px 0', opacity: reminder.completed ? .5 : 1 }}><div className="row"><button className={`check ${reminder.completed ? 'checked' : ''}`} type="button" onClick={() => data.toggleReminder(reminder.id)} aria-label={`Mark ${reminder.title} ${reminder.completed ? 'incomplete' : 'complete'}`}>{reminder.completed && <Check size={15} />}</button><div><strong className="small" style={{ textDecoration: reminder.completed ? 'line-through' : 'none' }}>{reminder.title}</strong><div className="muted tiny">{reminder.category}</div></div></div><span className="muted small">{reminder.time}</span></div>)}
        </div>
      </section>
    </div>
  )
}

function Macro({ label, value, target }: { label: string; value: number; target: number }) {
  return <div className="macro"><strong>{Math.round(value)}g</strong><span>{label} · {target}g</span><div className="macro-bar"><i style={{ width: `${Math.min(100, (value / target) * 100)}%` }} /></div></div>
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="metric"><span className="row muted" style={{ gap: 5 }}>{icon}<span className="tiny">{label}</span></span><span className="metric-value" style={{ marginTop: 5 }}>{value}</span></div>
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
