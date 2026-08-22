export interface MacroInput { calories: number; protein: number; carbs: number; fat: number; fiber?: number }
export interface MacroTotal { calories: number; protein: number; carbs: number; fat: number; fiber: number }

export function sumNutrition(items: MacroInput[]): MacroTotal {
  return items.reduce<MacroTotal>((total, item) => ({
    calories: total.calories + item.calories,
    protein: total.protein + item.protein,
    carbs: total.carbs + item.carbs,
    fat: total.fat + item.fat,
    fiber: total.fiber + (item.fiber ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}

export function recipePerServing(items: MacroInput[], servings: number) {
  if (!Number.isFinite(servings) || servings <= 0) throw new Error('Servings must be greater than zero')
  const total = sumNutrition(items)
  return {
    calories: total.calories / servings,
    protein: total.protein / servings,
    carbs: total.carbs / servings,
    fat: total.fat / servings,
    fiber: total.fiber / servings,
  }
}

export function movingAverage(values: number[], windowSize = 7) {
  if (windowSize <= 0) throw new Error('Window size must be positive')
  return values.map((_, index) => {
    const window = values.slice(Math.max(0, index - windowSize + 1), index + 1)
    return window.reduce((sum, value) => sum + value, 0) / window.length
  })
}

export function progressionRecommendation(sets: Array<{ reps: number; rir: number; completed: boolean }>, upperRepTarget: number, targetRir = 2) {
  const allHitUpper = sets.length > 0 && sets.every((set) => set.completed && set.reps >= upperRepTarget)
  const effortOnTarget = sets.every((set) => set.rir >= Math.max(0, targetRir - 1))
  return allHitUpper && effortOnTarget ? 'increase_load' : 'beat_previous_performance'
}
