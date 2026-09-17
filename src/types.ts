export type TabId = 'today' | 'train' | 'food' | 'life' | 'insights'

export interface DailyLog {
  waterMl: number
  steps: number
  walkingMinutes: number
  sleepHours: number
  sleepQuality: number
  weight?: number
  pain?: { score: number; location: string; note?: string }
}

export interface MealEntry {
  id: string
  name: string
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  calories: number
  protein: number
  carbs: number
  fat: number
  source: 'published' | 'calculated' | 'estimated' | 'user_entered'
}

export interface Goal {
  id: string
  title: string
  category: string
  progress: number
  nextAction: string
  status: 'active' | 'completed'
}

export interface TravelPlan {
  id: string
  destination: string
  country: string
  dates: string
  status: 'Wishlist' | 'Researching' | 'Planning' | 'Booked' | 'Traveling' | 'Completed'
  progress: number
}

export interface Reminder {
  id: string
  title: string
  time?: string
  completed: boolean
  category: string
}

export interface SetLog {
  id: string
  weight: number
  reps: number
  rir: number
  completed: boolean
  notes?: string
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: SetLog[]
  repRange: string
  previous: string
  trackingMode?: 'sets_reps' | 'duration'
  activityType?: 'walk' | 'swim' | 'other'
  sessionAdded?: boolean
}

export interface WorkoutPrescriptionItem {
  id: string
  title: string
  metadata: Record<string, unknown>
}

export interface WorkoutHistorySet {
  id: string
  set_number: number
  weight: number | null
  weight_unit: string
  reps: number | null
  rir: number | null
  completed: boolean
  notes?: string | null
  performed_at?: string | null
}

export interface WorkoutHistoryExercise {
  id: string
  position: number
  notes?: string | null
  exercises?: { name: string; category?: string | null } | Array<{ name: string; category?: string | null }> | null
  set_logs?: WorkoutHistorySet[]
}

export interface WorkoutHistoryEntry {
  id: string
  planned_session_id?: string | null
  session_date: string
  started_at?: string | null
  completed_at?: string | null
  status: string
  notes?: string | null
  planned_sessions?: { title: string } | Array<{ title: string }> | null
  exercise_logs?: WorkoutHistoryExercise[]
}
