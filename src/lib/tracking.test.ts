import { describe, expect, it } from 'vitest'
import { movingAverage, progressionRecommendation, recipePerServing, sumNutrition } from './tracking'

describe('nutrition calculations', () => {
  it('calculates daily totals', () => {
    expect(sumNutrition([
      { calories: 400, protein: 30, carbs: 50, fat: 10, fiber: 8 },
      { calories: 250, protein: 20, carbs: 20, fat: 8, fiber: 3 },
    ])).toEqual({ calories: 650, protein: 50, carbs: 70, fat: 18, fiber: 11 })
  })

  it('recalculates recipe macros per serving', () => {
    expect(recipePerServing([{ calories: 800, protein: 40, carbs: 100, fat: 24 }], 4)).toEqual({ calories: 200, protein: 10, carbs: 25, fat: 6, fiber: 0 })
  })
})

describe('trend and progression logic', () => {
  it('returns a partial moving average for the first six values', () => {
    expect(movingAverage([70, 71, 72], 2)).toEqual([70, 70.5, 71.5])
  })

  it('only suggests adding load when all sets satisfy the rule', () => {
    expect(progressionRecommendation([
      { reps: 10, rir: 2, completed: true },
      { reps: 10, rir: 1, completed: true },
      { reps: 10, rir: 2, completed: true },
    ], 10)).toBe('increase_load')
    expect(progressionRecommendation([{ reps: 9, rir: 2, completed: true }], 10)).toBe('beat_previous_performance')
  })
})
