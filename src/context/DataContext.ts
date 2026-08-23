import { createContext, useContext } from 'react'
import type { DailyLog, Goal, MealEntry, Reminder, TravelPlan, WorkoutExercise } from '../types'

export interface DataState {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  daily: DailyLog
  meals: MealEntry[]
  reminders: Reminder[]
  goals: Goal[]
  trips: TravelPlan[]
  workout: WorkoutExercise[]
  syncPending: boolean
  addMeal: (entry: Omit<MealEntry, 'id'>) => void
  updateDaily: (patch: Partial<DailyLog>) => void
  toggleReminder: (id: string) => void
  addReminder: (title: string, time?: string) => void
  addGoal: (title: string, category: string) => void
  addTrip: (destination: string, country: string) => void
  updateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'rir' | 'completed' | 'notes', value: number | boolean | string) => void
  loadWorkoutFromPlan: (items: Array<{ id: string; title: string; metadata: Record<string, unknown> }>, plannedSessionId?: string) => Promise<void>
  copyStarterTemplate: () => void
  saveWorkout: (plannedSessionId?: string) => Promise<void>
  resetDemo: () => void
}

export const DataContext = createContext<DataState | null>(null)

export function useData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
