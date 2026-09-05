import type { Goal, MealEntry, Reminder, TravelPlan, WorkoutExercise } from '../types'

export const demoMeals: MealEntry[] = [
  { id: 'm1', name: 'Greek yogurt bowl', meal: 'Breakfast', calories: 390, protein: 31, carbs: 46, fat: 9, source: 'calculated' },
  { id: 'm2', name: 'Tofu grain bowl', meal: 'Lunch', calories: 610, protein: 38, carbs: 72, fat: 19, source: 'estimated' },
  { id: 'm3', name: 'Protein smoothie', meal: 'Snack', calories: 240, protein: 28, carbs: 24, fat: 5, source: 'calculated' },
]

export const demoReminders: Reminder[] = [
  { id: 'r1', title: 'Evening walk', time: '6:30 PM', completed: false, category: 'Movement' },
  { id: 'r2', title: 'Weekly reflection', time: '8:00 PM', completed: false, category: 'Life' },
]

export const demoGoals: Goal[] = [
  { id: 'g1', title: 'Build a consistent workout rhythm', category: 'Fitness', progress: 68, nextAction: 'Complete this week’s final session', status: 'active' },
  { id: 'g2', title: 'Ship a meaningful side project', category: 'Projects', progress: 42, nextAction: 'Finish the onboarding flow', status: 'active' },
]

export const demoTrips: TravelPlan[] = [
  { id: 't1', destination: 'Kyoto', country: 'Japan', dates: '12–20 Oct', status: 'Planning', progress: 55 },
]

function set(id: string, weight: number, reps: number, rir = 2) {
  return { id, weight, reps, rir, completed: false }
}

export const demoWorkout: WorkoutExercise[] = [
  { id: 'e1', name: 'Incline dumbbell press', repRange: '3 × 8–10', previous: '17.5 kg × 9, 9, 8', sets: [set('s1', 17.5, 0), set('s2', 17.5, 0), set('s3', 17.5, 0)] },
  { id: 'e2', name: 'Chest-supported row', repRange: '3 × 8–10', previous: '45 kg × 10, 9, 9', sets: [set('s4', 45, 0), set('s5', 45, 0), set('s6', 45, 0)] },
  { id: 'e3', name: 'Machine shoulder press', repRange: '3 × 8–12', previous: '30 kg × 11, 10, 9', sets: [set('s7', 30, 0), set('s8', 30, 0), set('s9', 30, 0)] },
  { id: 'e4', name: 'Lean-in lateral raise', repRange: '3 × 12–20', previous: '7.5 kg × 16, 15, 13', sets: [set('s10', 7.5, 0), set('s11', 7.5, 0), set('s12', 7.5, 0)] },
]

export const chartData = [
  { day: 'Mon', protein: 124, calories: 2050, steps: 7400, sleep: 7.2 },
  { day: 'Tue', protein: 141, calories: 2180, steps: 8800, sleep: 7.8 },
  { day: 'Wed', protein: 135, calories: 2100, steps: 10200, sleep: 6.9 },
  { day: 'Thu', protein: 147, calories: 2220, steps: 7900, sleep: 7.5 },
  { day: 'Fri', protein: 128, calories: 1980, steps: 9400, sleep: 8.1 },
  { day: 'Sat', protein: 152, calories: 2250, steps: 11100, sleep: 7.7 },
  { day: 'Sun', protein: 136, calories: 2080, steps: 6800, sleep: 8.0 },
]
