import { useState, type FormEvent } from 'react'
import { ArrowUpRight, BookOpenText, CheckCircle2, FolderKanban, Heart, Lightbulb, MoreHorizontal, Plus, Sparkles } from 'lucide-react'
import { useData } from '../context/DataContext'
import { ProgressRing } from '../components/ProgressRing'
import { Sheet } from '../components/Sheet'
import { useAuth } from '../context/AuthContext'

type LifeTab = 'goals' | 'wishes' | 'travel' | 'projects' | 'notes'

export function LifePage() {
  const [tab, setTab] = useState<LifeTab>('goals')
  const [addOpen, setAddOpen] = useState(false)
  const data = useData()
  const auth = useAuth()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (tab === 'goals') data.addGoal(String(values.title), String(values.category))
    if (tab === 'travel') data.addTrip(String(values.title), String(values.country))
    setAddOpen(false)
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Life</p><h1>Make room for what matters.</h1><p className="muted">Goals, wishes, trips and meaningful work.</p></div><button className="btn btn-primary btn-icon" type="button" onClick={() => setAddOpen(true)} aria-label={`Add ${tab}`}><Plus size={20} /></button></header>

      <div className="tabs" role="tablist">
        {(['goals', 'wishes', 'travel', 'projects', 'notes'] as const).map((item) => <button key={item} className={`tab ${tab === item ? 'active' : ''}`} type="button" onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>

      {tab === 'goals' && <>
        <section className="section"><div className="section-title"><h2>Active goals</h2><span className="badge">{data.goals.filter((goal) => goal.status === 'active').length} in focus</span></div><div className="grid-2">{data.goals.map((goal) => <article className="card goal-card" key={goal.id}><div className="row-between"><span className="badge badge-neutral">{goal.category}</span><button className="btn btn-ghost btn-icon" type="button" aria-label={`More options for ${goal.title}`}><MoreHorizontal size={18} /></button></div><h2 style={{ marginTop: 17 }}>{goal.title}</h2><div className="goal-progress"><ProgressRing value={goal.progress} /><div><span className="muted tiny">Next action</span><p className="small" style={{ margin: '4px 0 0' }}>{goal.nextAction}</p></div></div></article>)}</div></section>
        <section className="card card-pad section row-between"><div className="row"><span className="icon-bubble"><CheckCircle2 size={19} /></span><div><strong>Quarterly focus</strong><div className="muted small">2 goals moved forward this week</div></div></div><ArrowUpRight className="muted" size={19} /></section>
      </>}

      {tab === 'wishes' && <section className="section"><div className="section-title"><h2>Wishes & someday</h2><button className="link-button small" type="button" onClick={() => setAddOpen(true)}><Plus size={14} style={{ verticalAlign: -2 }} /> Add wish</button></div><div className="grid-2">{auth.isDemo && <><Wish title="Learn conversational Japanese" status="Planning" category="Learning" /><Wish title="See the northern lights" status="Someday" category="Travel" /></>}<button className="card card-pad empty-state" style={{ borderStyle: 'dashed', cursor: 'pointer' }} type="button" onClick={() => setAddOpen(true)}><Lightbulb size={24} style={{ margin: '0 auto 8px' }} />Capture a wish without turning it into a task.</button></div></section>}

      {tab === 'travel' && <section className="section"><div className="section-title"><h2>Travel plans</h2><button className="link-button small" type="button" onClick={() => setAddOpen(true)}><Plus size={14} style={{ verticalAlign: -2 }} /> Plan a trip</button></div><div className="grid-2">{data.trips.map((trip) => <article className="card card-pad" key={trip.id}><div className="trip-visual"><span className="tiny" style={{ opacity: .8 }}>{trip.country}</span><h2 style={{ margin: 3 }}>{trip.destination}</h2></div><div className="row-between" style={{ marginTop: 14 }}><div><span className="badge">{trip.status}</span><p className="muted small" style={{ margin: '8px 0 0' }}>{trip.dates}</p></div><ProgressRing value={trip.progress} size={52} /></div></article>)}</div></section>}

      {tab === 'projects' && <section className="section"><div className="grid-2">{auth.isDemo && <><LifeCard icon={<FolderKanban size={20} />} title="Personal site refresh" meta="In progress · Due 30 Sep" progress={64} /><LifeCard icon={<Sparkles size={20} />} title="Home organization" meta="Planning · No deadline" progress={25} /></>}<button className="card card-pad empty-state" style={{ borderStyle: 'dashed', cursor: 'pointer' }} type="button" onClick={() => setAddOpen(true)}><Plus size={24} style={{ margin: '0 auto 8px' }} />Create a project and define the first action.</button></div></section>}

      {tab === 'notes' && <section className="section"><div className="card card-pad"><label className="field"><span>Today’s note</span><textarea className="textarea" placeholder="What’s on your mind? Keep it light or write as much as you need." style={{ minHeight: 150 }} /></label><div className="row-between" style={{ marginTop: 12 }}><span className="muted tiny">Saved privately to today</span><button className="btn btn-primary btn-small" type="button">Save note</button></div></div><div className="section-title" style={{ marginTop: 26 }}><h2>Recent notes</h2></div><div className="card card-pad empty-state"><BookOpenText size={24} style={{ margin: '0 auto 8px' }} />Your dated reflections will appear here.</div></section>}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={`Add ${tab === 'travel' ? 'trip' : tab.slice(0, -1)}`} description="Keep it simple now; add detail when it becomes useful.">
        <form className="form-grid" onSubmit={submit}>
          <label className="field"><span>{tab === 'travel' ? 'Destination' : 'Title'}</span><input className="input" name="title" required placeholder={tab === 'goals' ? 'What would meaningful progress look like?' : 'Add a title'} /></label>
          {tab === 'goals' && <label className="field"><span>Category</span><select className="select" name="category"><option>Fitness</option><option>Career</option><option>Money</option><option>Learning</option><option>Personal</option><option>Relationships</option><option>Travel</option><option>Projects</option></select></label>}
          {tab === 'travel' && <label className="field"><span>Country</span><input className="input" name="country" required /></label>}
          <label className="field"><span>Why / notes</span><textarea className="textarea" name="notes" placeholder="Why does this matter?" /></label>
          <button className="btn btn-primary" type="submit">Save to Life</button>
        </form>
      </Sheet>
    </div>
  )
}

function Wish({ title, status, category }: { title: string; status: string; category: string }) {
  return <article className="card card-pad"><div className="row-between"><span className="icon-bubble"><Heart size={18} /></span><span className="badge badge-neutral">{status}</span></div><h2 style={{ marginTop: 18 }}>{title}</h2><p className="muted small" style={{ margin: 0 }}>{category}</p></article>
}

function LifeCard({ icon, title, meta, progress }: { icon: React.ReactNode; title: string; meta: string; progress: number }) {
  return <article className="card card-pad"><div className="row"><span className="icon-bubble">{icon}</span><div><h3 style={{ margin: 0 }}>{title}</h3><span className="muted tiny">{meta}</span></div></div><div className="progress-track" style={{ marginTop: 18 }}><div className="progress-fill" style={{ width: `${progress}%` }} /></div></article>
}
