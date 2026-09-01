import { addDays, format } from 'date-fns'
import { describe, expect, it } from 'vitest'
import {
  interviewPhases,
  interviewRoadmapDefinition,
  interviewTodayTasks,
  leetcodeHref,
  noteFields,
  resourceHref,
  revisionOffsets,
} from './interview'
import type { PlannedSession } from '../types/v2'

describe('interview preparation roadmap', () => {
  const days=interviewRoadmapDefinition.weeks.flatMap((week)=>week.days)
  const tasks=days.flatMap((day)=>day.tasks)
  const problems=[...interviewRoadmapDefinition.baseline,...tasks].filter((task)=>'leetcodeSlug' in task&&Boolean(task.leetcodeSlug))

  it('contains the complete canonical curriculum',()=>{
    expect(interviewRoadmapDefinition.weeks).toHaveLength(9)
    expect(days).toHaveLength(62)
    expect(tasks).toHaveLength(179)
    expect(new Set(problems.map((problem)=>problem.leetcodeSlug))).toHaveLength(87)
    expect(interviewRoadmapDefinition.resources).toHaveLength(28)
  })

  it('generates every session on its exact authored date',()=>{
    const start=new Date('2026-09-01T12:00:00')
    const generated=interviewPhases[0].blocks.flatMap((block)=>block.sessions.map((session)=>format(addDays(start,(block.week-1)*7+session.day_offset),'yyyy-MM-dd')))
    expect(generated).toEqual(days.map((day)=>day.date))
  })

  it('builds canonical resource and problem links',()=>{
    for(const resource of interviewRoadmapDefinition.resources)expect(resourceHref({provider_host:resource.providerHost,path:resource.path})).toBe(`https://${resource.providerHost}${resource.path}`)
    for(const problem of problems)expect(leetcodeHref(problem.leetcodeSlug!)).toBe(`https://leetcode.com/problems/${problem.leetcodeSlug}/`)
  })

  it('carries required unfinished work without rewriting its original date',()=>{
    const session:PlannedSession={id:'s',plan_id:'p',domain:'study',title:'Prior day',scheduled_date:'2026-08-31',status:'planned',planned_items:[{id:'i',planned_session_id:'s',domain:'study',item_type:'problem',title:'Container With Most Water',position:0,required:true,status:'active',metadata:{interview_os:true,subject:'DSA',topic:'two-pointers',priority:'high'}}]}
    const [carried]=interviewTodayTasks([session],'2026-09-01')
    expect(carried).toMatchObject({effectiveDate:'2026-08-31',overdue:true})
    expect(session.scheduled_date).toBe('2026-08-31')
  })

  it('uses the requested score-based revision spacing',()=>{
    expect(revisionOffsets(0)).toEqual([1])
    expect(revisionOffsets(1)).toEqual([1,3])
    expect(revisionOffsets(2)).toEqual([3,7])
    expect(revisionOffsets(3)).toEqual([7,21])
  })

  it('provides subject-specific structured note schemas',()=>{
    expect(noteFields('DSA','sliding-window','problem')).toContain('Window invariant')
    expect(noteFields('HLD','url-shortener','design')).toContain('Capacity Estimates')
    expect(noteFields('LLD','parking-lot','design')).toContain('Class diagram')
  })
})
