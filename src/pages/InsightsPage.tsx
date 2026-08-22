import { useState } from 'react'
import { Activity, ArrowDownRight, ArrowRight, BarChart3, Brain, CheckCircle2, Dumbbell, HeartPulse, Leaf, Moon, Scale, Sparkles, TrendingUp } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartData } from '../data/demo'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type InsightType = 'nutrition' | 'activity' | 'recovery'

export function InsightsPage() {
  const [range, setRange] = useState('7D')
  const [type, setType] = useState<InsightType>('nutrition')
  const data = useData()
  const auth = useAuth()
  const navigate = useNavigate()
  const currentTotals = data.meals.reduce((sum, meal) => ({ protein: sum.protein + meal.protein, calories: sum.calories + meal.calories }), { protein: 0, calories: 0 })
  const insightData = auth.isDemo ? chartData : [{ day: 'Today', protein: currentTotals.protein, calories: currentTotals.calories, steps: data.daily.steps, sleep: data.daily.sleepHours }]
  const averages = {
    protein: Math.round(insightData.reduce((sum, item) => sum + item.protein, 0) / insightData.length),
    calories: Math.round(insightData.reduce((sum, item) => sum + item.calories, 0) / insightData.length),
    steps: Math.round(insightData.reduce((sum, item) => sum + item.steps, 0) / insightData.length),
    sleep: (insightData.reduce((sum, item) => sum + item.sleep, 0) / insightData.length).toFixed(1),
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Insights</p><h1>Patterns, made useful.</h1><p className="muted">Understand the trend without drowning in data.</p></div><span className="icon-bubble"><BarChart3 size={21} /></span></header>

      <div className="range-picker">{['7D', '30D', '3M', '6M', '1Y', 'Custom'].map((item) => <button key={item} className={`tab ${range === item ? 'active' : ''}`} type="button" onClick={() => setRange(item)}>{item}</button>)}</div>

      <div className="grid-3 section">
        <Summary icon={<Dumbbell size={18} />} label="Workouts" value={auth.isDemo ? '3 / 4' : '0'} delta={auth.isDemo ? '75% adherence' : 'Start logging to build a trend'} />
        <Summary icon={<Leaf size={18} />} label="Avg protein" value={`${averages.protein}g`} delta="5g from target" />
        <Summary icon={<Activity size={18} />} label="Avg steps" value={averages.steps.toLocaleString()} delta="+8% vs prior week" positive />
      </div>

      <section className="card card-pad section">
        <div className="row-between"><div><h2 style={{ marginBottom: 4 }}>Your week in motion</h2><span className="muted small">{range} trend</span></div><div className="tabs" style={{ padding: 3 }}>{(['nutrition', 'activity', 'recovery'] as const).map((item) => <button type="button" key={item} className={`tab ${type === item ? 'active' : ''}`} style={{ minHeight: 32, padding: '0 9px', fontSize: 11 }} onClick={() => setType(item)}>{item}</button>)}</div></div>
        <div className="chart-wrap" aria-label={`${type} trend chart`}>
          <ResponsiveContainer width="100%" height="100%">
            {type === 'activity' ? <BarChart data={insightData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis hide /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)' }} /><Bar dataKey="steps" fill="#3aa76d" radius={[6,6,0,0]} /></BarChart> : <AreaChart data={insightData}><defs><linearGradient id="insightFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3aa76d" stopOpacity={.28}/><stop offset="95%" stopColor="#3aa76d" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis hide domain={type === 'recovery' ? [0, 9] : ['dataMin - 15', 'dataMax + 15']} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)' }} /><Area type="monotone" dataKey={type === 'recovery' ? 'sleep' : 'protein'} stroke="#25935a" strokeWidth={2.5} fill="url(#insightFill)" /></AreaChart>}
          </ResponsiveContainer>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>Worth noticing</h2><span className="badge"><Sparkles size={12} /> Based on your logs</span></div>
        <div className="grid-2">
          <article className="insight-callout"><div className="row"><Moon size={18} /><strong className="small">Recovery pattern</strong></div><p className="muted small" style={{ margin: '9px 0 0' }}>Your average sleep was {averages.sleep} hours. Sessions following 7+ hours had more completed working sets.</p></article>
          <article className="insight-callout"><div className="row"><HeartPulse size={18} /><strong className="small">Pain signal</strong></div><p className="muted small" style={{ margin: '9px 0 0' }}>Not enough repeated data yet for a useful association. Keep logging location and exercise context.</p></article>
        </div>
      </section>

      <section className="card card-pad section">
        <div className="row-between"><div><p className="eyebrow">Weekly review</p><h2 style={{ margin: 0 }}>A clear look back.</h2></div><span className="badge badge-neutral">Mon–Sun</span></div>
        <div className="grid-3" style={{ marginTop: 20 }}><ReviewMetric icon={<CheckCircle2 size={16} />} value={auth.isDemo ? '3 / 4' : '0'} label="workouts" /><ReviewMetric icon={<Leaf size={16} />} value={`${averages.calories}`} label="avg kcal" /><ReviewMetric icon={<Scale size={16} />} value={auth.isDemo ? 'Steady' : 'Not enough data'} label="weight trend" /></div>
        <div className="divider" />
        <ul className="small" style={{ color: 'var(--muted)', paddingLeft: 20, lineHeight: 1.9, margin: 0 }}><li>Protein target reached on 3 of 7 days</li><li>{averages.steps.toLocaleString()} average daily steps</li><li>{data.daily.walkingMinutes * 7} walking minutes logged</li><li>No repeated pain trend detected</li><li>{data.goals.length} active goals in progress</li></ul>
        <div className="grid-2" style={{ marginTop: 18 }}><label className="field"><span>What worked?</span><textarea className="textarea" placeholder="Keep the parts that felt sustainable…" /></label><label className="field"><span>What needs changing?</span><textarea className="textarea" placeholder="One adjustment for next week…" /></label></div>
        <button className="btn btn-primary btn-small" type="button" style={{ marginTop: 12 }}>Save weekly reflection</button>
      </section>

      <section className="card card-pad section row-between" role="link" tabIndex={0} onClick={() => navigate('/health')} onKeyDown={(event) => event.key === 'Enter' && navigate('/health')} style={{ cursor: 'pointer' }}><div className="row"><span className="icon-bubble"><Brain size={19} /></span><div><strong>Health & bloodwork</strong><div className="muted small">Track biomarkers over time, without diagnosis</div></div></div><ArrowRight className="muted" size={19} /></section>
    </div>
  )
}

function Summary({ icon, label, value, delta, positive }: { icon: React.ReactNode; label: string; value: string; delta: string; positive?: boolean }) {
  return <article className="card card-pad"><div className="row-between"><span className="icon-bubble">{icon}</span>{positive ? <TrendingUp size={17} color="var(--brand)" /> : <ArrowDownRight size={17} className="muted" />}</div><span className="metric-value" style={{ marginTop: 15 }}>{value}</span><span className="metric-label">{label}</span><p className="muted tiny" style={{ margin: '10px 0 0' }}>{delta}</p></article>
}

function ReviewMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="metric"><span className="row muted" style={{ gap: 5 }}>{icon}<span className="tiny">{label}</span></span><span className="metric-value" style={{ marginTop: 5 }}>{value}</span></div>
}
