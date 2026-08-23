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
}
