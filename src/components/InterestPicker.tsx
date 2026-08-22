import { BookOpen, Compass, Dumbbell, HeartPulse, Layers3, Sparkles } from 'lucide-react'
import { interestOptions, type DayframeInterest } from '../lib/personalization'

const icons = { train: Dumbbell, study: BookOpen, health: HeartPulse, life: Sparkles, everything: Layers3, exploring: Compass }

export function InterestPicker({ value, onChange }: { value: DayframeInterest[]; onChange: (value: DayframeInterest[]) => void }) {
  const toggle = (interest: DayframeInterest) => {
    if (interest === 'everything' || interest === 'exploring') return onChange([interest])
    const withoutBroad = value.filter((item) => item !== 'everything' && item !== 'exploring')
    onChange(withoutBroad.includes(interest) ? withoutBroad.filter((item) => item !== interest) : [...withoutBroad, interest])
  }

  return <div className="choice-grid">{interestOptions.map((option) => { const Icon = icons[option.value]; const selected = value.includes(option.value); return <button className={`choice-card ${selected ? 'selected' : ''}`} aria-pressed={selected} type="button" key={option.value} onClick={() => toggle(option.value)}><Icon size={20}/><span><strong>{option.label}</strong><small>{option.description}</small></span></button> })}</div>
}
