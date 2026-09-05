import { describe, expect, it } from 'vitest'
import { trainExerciseLibrary } from './trainExerciseLibrary'

describe('Train quick-session exercise library',()=>{
  it('covers lifting, general movement, walking and core work',()=>{
    expect(trainExerciseLibrary.some((item)=>item.name==='Walking'&&item.tracking==='duration')).toBe(true)
    expect(trainExerciseLibrary.some((item)=>item.name==='Crunches'&&item.category==='Core')).toBe(true)
    expect(new Set(trainExerciseLibrary.map((item)=>item.category))).toEqual(new Set(['Strength','Bodyweight','Core','Cardio','Mobility']))
  })

  it('has stable unique IDs for every selectable movement',()=>{
    expect(new Set(trainExerciseLibrary.map((item)=>item.id)).size).toBe(trainExerciseLibrary.length)
  })
})
