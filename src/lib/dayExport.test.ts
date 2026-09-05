import { describe, expect, it } from 'vitest'
import { buildDayExport } from './dayExport'
import type { PlannedSession } from '../types/v2'

const sessions: PlannedSession[] = [
  { id:'train-1', plan_id:'plan-1', domain:'train', title:'Upper A', scheduled_date:'2026-09-05', scheduled_time:'07:00', estimated_minutes:60, status:'planned', planned_items:[{id:'lift-1',planned_session_id:'train-1',domain:'train',item_type:'exercise',title:'Pull-Ups',position:0,required:true,status:'planned',metadata:{}}] },
  { id:'study-1', plan_id:'plan-2', domain:'study', title:'Interview prep', scheduled_date:'2026-09-05', scheduled_time:'10:00', estimated_minutes:75, status:'planned', planned_items:[{id:'task-1',planned_session_id:'study-1',domain:'study',item_type:'problem',title:'3Sum Closest',position:0,estimated_minutes:45,required:true,status:'planned',metadata:{}},{id:'task-2',planned_session_id:'study-1',domain:'study',item_type:'review',title:'Sliding Window review',position:1,estimated_minutes:30,required:true,status:'completed',metadata:{}}] },
]

describe('day export',()=>{
  it('creates one workout reminder and separate incomplete study tasks',()=>{
    const result=buildDayExport('2026-09-05',sessions,[{id:'travel-1',title:'Flight check-in',destination:'Kyoto',due_at:'2026-09-05T18:00:00'}])
    expect(result.items.map((item)=>item.title)).toEqual(['Upper A','3Sum Closest','Flight check-in'])
    expect(result.noteText).toContain('WORKOUTS\n□ Upper A')
    expect(result.noteText).toContain('STUDY\n□ 3Sum Closest')
    expect(result.noteText).toContain('TRAVEL\n□ Flight check-in')
    expect(JSON.parse(result.reminderPayload).items[0]).toMatchObject({title:'[Workouts] Upper A',dueAt:'2026-09-05T07:00:00'})
  })

  it('includes the next actionable workout when the selected day has only study',()=>{
    const nextWorkout={...sessions[0],scheduled_date:'2026-09-07'}
    const result=buildDayExport('2026-09-05',[sessions[1]],[],nextWorkout)
    expect(result.items.map((item)=>item.title)).toEqual(['Upper A','3Sum Closest'])
    expect(result.noteText).toContain('WORKOUTS\n□ Upper A\n  Next workout · Mon, Sep 7')
    expect(JSON.parse(result.reminderPayload).items[0]).toMatchObject({title:'[Workouts] Upper A',dueAt:'2026-09-07T07:00:00'})
  })

  it('does not export completed sessions or tasks from another day',()=>{
    const result=buildDayExport('2026-09-06',[...sessions,{...sessions[0],id:'done',scheduled_date:'2026-09-06',status:'completed'}])
    expect(result.items).toHaveLength(0)
    expect(result.noteText).toContain('Nothing is planned for this day yet.')
  })
})
