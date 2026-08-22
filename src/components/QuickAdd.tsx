import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Apple, Bell, Bike, CookingPot, Dumbbell, Footprints, GlassWater, HeartPulse, Map, Moon, NotebookPen, Plus, Ruler, Salad, Scale, Sparkles, Utensils, Waves, Weight, Zap } from 'lucide-react'
import { Sheet } from './Sheet'
import { useData } from '../context/DataContext'

const actions = [
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'set', label: 'Exercise / set', icon: Weight },
  { id: 'meal', label: 'Meal', icon: Utensils },
  { id: 'food', label: 'Custom food', icon: Apple },
  { id: 'recipe', label: 'Recipe', icon: CookingPot },
  { id: 'water', label: 'Water', icon: GlassWater },
  { id: 'walk', label: 'Walk', icon: Footprints },
  { id: 'swim', label: 'Swimming', icon: Waves },
  { id: 'steps', label: 'Steps', icon: Activity },
  { id: 'sauna', label: 'Sauna', icon: Zap },
  { id: 'steam', label: 'Steam', icon: Sparkles },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'weight', label: 'Bodyweight', icon: Scale },
  { id: 'measurement', label: 'Measurement', icon: Ruler },
  { id: 'pain', label: 'Pain', icon: HeartPulse },
  { id: 'supplement', label: 'Supplement', icon: Salad },
  { id: 'reminder', label: 'Reminder', icon: Bell },
  { id: 'note', label: 'Note', icon: NotebookPen },
  { id: 'goal', label: 'Goal', icon: Bike },
  { id: 'travel', label: 'Travel item', icon: Map },
] as const

type ActionId = typeof actions[number]['id']

interface QuickAddProps {
  open: boolean
  onClose: () => void
  onSaved: (message: string) => void
}

export function QuickAdd({ open, onClose, onSaved }: QuickAddProps) {
  const [selected, setSelected] = useState<ActionId | null>(null)
  const data = useData()
  const navigate = useNavigate()

  const close = () => {
    setSelected(null)
    onClose()
  }

  const choose = (id: ActionId) => {
    if (id === 'workout' || id === 'set') {
      close()
      navigate('/train')
      return
    }
    if (id === 'travel') {
      close()
      navigate('/life')
      return
    }
    setSelected(id)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const amount = Number(values.amount || 0)
    if (selected === 'water') data.updateDaily({ waterMl: data.daily.waterMl + amount })
    if (selected === 'walk') data.updateDaily({ walkingMinutes: data.daily.walkingMinutes + amount })
    if (selected === 'steps') data.updateDaily({ steps: amount })
    if (selected === 'sleep') data.updateDaily({ sleepHours: amount, sleepQuality: Number(values.quality || 3) })
    if (selected === 'weight') data.updateDaily({ weight: amount })
    if (selected === 'pain') data.updateDaily({ pain: { score: amount, location: String(values.location || 'Not specified'), note: String(values.note || '') } })
    if (selected === 'reminder') data.addReminder(String(values.title), String(values.time || ''))
    if (selected === 'goal') data.addGoal(String(values.title), String(values.category || 'Personal'))
    if (selected === 'meal' || selected === 'food' || selected === 'recipe') {
      data.addMeal({
        name: String(values.title),
        meal: String(values.meal || 'Snack') as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
        calories: Number(values.calories || 0),
        protein: Number(values.protein || 0),
        carbs: Number(values.carbs || 0),
        fat: Number(values.fat || 0),
        source: 'user_entered',
      })
    }
    onSaved(`${actions.find((item) => item.id === selected)?.label ?? 'Entry'} saved`)
    close()
  }

  return (
    <Sheet open={open} onClose={close} title={selected ? `Log ${actions.find((item) => item.id === selected)?.label.toLowerCase()}` : 'Quick add'} description={selected ? 'Saved to the selected day.' : 'Everything you track, one tap away.'}>
      {!selected ? (
        <div className="quick-grid">
          {actions.map(({ id, label, icon: Icon }) => (
            <button className="quick-item" type="button" key={id} onClick={() => choose(id)}>
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      ) : (
        <form className="form-grid" onSubmit={submit}>
          {(selected === 'meal' || selected === 'food' || selected === 'recipe') && <MealFields />}
          {selected === 'water' && <NumberField label="Amount (ml)" name="amount" defaultValue="350" />}
          {(selected === 'walk' || selected === 'swim' || selected === 'sauna' || selected === 'steam') && <NumberField label="Duration (minutes)" name="amount" defaultValue="20" />}
          {selected === 'steps' && <NumberField label="Step count" name="amount" defaultValue={String(data.daily.steps)} />}
          {selected === 'sleep' && <>
            <NumberField label="Duration (hours)" name="amount" defaultValue="7.5" step="0.1" />
            <NumberField label="Quality (1–5)" name="quality" defaultValue="4" min="1" max="5" />
          </>}
          {selected === 'weight' && <NumberField label="Bodyweight (kg)" name="amount" step="0.1" placeholder="e.g. 72.4" />}
          {selected === 'measurement' && <>
            <label className="field"><span>Measurement</span><select className="select" name="kind"><option>WHO-standard waist</option><option>Navel circumference</option><option>Lower abdomen</option><option>Chest</option><option>Hips</option><option>Arms</option><option>Thighs</option></select></label>
            <NumberField label="Value (cm)" name="amount" step="0.1" placeholder="e.g. 82.5" />
          </>}
          {selected === 'pain' && <>
            <NumberField label="Pain score (0–10)" name="amount" min="0" max="10" defaultValue="2" />
            <label className="field"><span>Body location</span><input className="input" name="location" placeholder="e.g. lower back" required /></label>
            <label className="field"><span>Notes (optional)</span><textarea className="textarea" name="note" placeholder="What were you doing?" /></label>
          </>}
          {(selected === 'reminder' || selected === 'goal') && <label className="field"><span>Title</span><input className="input" name="title" placeholder={selected === 'goal' ? 'What do you want to achieve?' : 'What should you remember?'} required /></label>}
          {selected === 'reminder' && <label className="field"><span>Time (optional)</span><input className="input" type="time" name="time" /></label>}
          {selected === 'goal' && <label className="field"><span>Category</span><select className="select" name="category"><option>Fitness</option><option>Career</option><option>Money</option><option>Learning</option><option>Personal</option><option>Relationships</option><option>Travel</option><option>Projects</option></select></label>}
          {(selected === 'note' || selected === 'supplement') && <label className="field"><span>{selected === 'note' ? 'Note' : 'Supplement and dose'}</span><textarea className="textarea" name="note" placeholder="Add details…" required /></label>}
          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn btn-secondary" type="button" onClick={() => setSelected(null)}>Back</button>
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }}><Plus size={17} /> Save entry</button>
          </div>
        </form>
      )}
    </Sheet>
  )
}

function NumberField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field"><span>{label}</span><input className="input" type="number" name="amount" required {...props} /></label>
}

function MealFields() {
  return <>
    <label className="field"><span>Name</span><input className="input" name="title" placeholder="Meal or recipe name" required /></label>
    <label className="field"><span>Meal</span><select className="select" name="meal"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label>
    <div className="grid-2">
      <NumberField label="Calories" name="calories" min="0" />
      <NumberField label="Protein (g)" name="protein" min="0" step="0.1" />
      <NumberField label="Carbs (g)" name="carbs" min="0" step="0.1" />
      <NumberField label="Fat (g)" name="fat" min="0" step="0.1" />
    </div>
  </>
}
