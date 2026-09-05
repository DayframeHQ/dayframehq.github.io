import { format } from 'date-fns'
import type { PlannedSession } from '../types/v2'

export type DayExportCategory = 'Workouts' | 'Study' | 'Travel'

export interface DayTravelItem {
  id: string
  title: string
  details?: string | null
  due_at?: string | null
  destination?: string | null
}

export interface DayExportItem {
  id: string
  category: DayExportCategory
  title: string
  detail?: string
  dueAt: string
}

export interface DayExport {
  date: string
  title: string
  items: DayExportItem[]
  noteText: string
  reminderPayload: string
}

const categoryOrder: DayExportCategory[] = ['Workouts', 'Study', 'Travel']

function dueAt(date: string, time?: string | null) {
  return `${date}T${time?.slice(0, 5) || '09:00'}:00`
}

function sessionItems(session: PlannedSession, isNextWorkout = false): DayExportItem[] {
  const category: DayExportCategory = session.domain === 'train' ? 'Workouts' : 'Study'
  const children = session.planned_items ?? []
  const sessionDetail = [
    isNextWorkout ? `Next workout · ${format(new Date(`${session.scheduled_date}T12:00:00`), 'EEE, MMM d')}` : '',
    session.estimated_minutes ? `${session.estimated_minutes} min` : '',
    children.length ? children.map((item) => item.title).join(' · ') : '',
  ].filter(Boolean).join(' · ')

  if (category === 'Workouts' || !children.length) {
    return [{ id: session.id, category, title: session.title, detail: sessionDetail || undefined, dueAt: dueAt(session.scheduled_date, session.scheduled_time) }]
  }

  let elapsed=0
  return children.filter((item) => item.status !== 'completed' && item.status !== 'skipped').map((item) => {
    const itemDueAt=dueAt(session.scheduled_date,session.scheduled_time?offsetTime(session.scheduled_time,elapsed):null)
    elapsed+=item.estimated_minutes??30
    return{id:item.id,category,title:item.title,detail:[session.title,item.estimated_minutes?`${item.estimated_minutes} min`:''].filter(Boolean).join(' · '),dueAt:itemDueAt}
  })
}

function offsetTime(time: string, minutes: number) {
  const [hours, mins] = time.slice(0, 5).split(':').map(Number)
  const total = hours * 60 + mins + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function buildDayExport(date: string, sessions: PlannedSession[], travel: DayTravelItem[] = [], nextWorkout?: PlannedSession): DayExport {
  const selectedSessions = sessions.filter((session) => session.scheduled_date === date && session.status !== 'completed' && session.status !== 'skipped')
  const sessionRows = selectedSessions
    .flatMap((session) => sessionItems(session))
  const fallbackWorkoutRows = !selectedSessions.some((session) => session.domain === 'train')
    && nextWorkout?.domain === 'train'
    && nextWorkout.scheduled_date >= date
    && nextWorkout.status !== 'completed'
    && nextWorkout.status !== 'skipped'
    ? sessionItems(nextWorkout, true)
    : []
  const travelRows: DayExportItem[] = travel.map((item) => ({
    id: item.id,
    category: 'Travel',
    title: item.title,
    detail: [item.destination, item.details].filter(Boolean).join(' · ') || undefined,
    dueAt: item.due_at ?? dueAt(date),
  }))
  const items = [...fallbackWorkoutRows, ...sessionRows, ...travelRows]
  const displayDate = format(new Date(`${date}T12:00:00`), 'EEEE, MMMM d, yyyy')
  const title = `Dayframe — ${displayDate}`
  const sections = categoryOrder.flatMap((category) => {
    const rows = items.filter((item) => item.category === category)
    if (!rows.length) return []
    return [`${category.toUpperCase()}`, ...rows.flatMap((item) => [`□ ${item.title}`, ...(item.detail ? [`  ${item.detail}`] : [])])]
  })
  const noteText = [title, '', ...(sections.length ? intersperseSections(sections) : ['Nothing is planned for this day yet.']), '', 'Planned in Dayframe'].join('\n')
  const reminderPayload = JSON.stringify({
    version: 1,
    source: 'Dayframe',
    date,
    listName: 'Dayframe',
    items: items.map((item) => ({ title: `[${item.category}] ${item.title}`, notes: item.detail ?? '', dueAt: item.dueAt })),
  })
  return { date, title, items, noteText, reminderPayload }
}

function intersperseSections(lines: string[]) {
  const output: string[] = []
  for (const line of lines) {
    if (/^[A-Z]+$/.test(line) && output.length) output.push('')
    output.push(line)
  }
  return output
}
