import { differenceInCalendarDays } from 'date-fns'
import roadmap from '../data/interviewRoadmap.json'
import type { InterviewSubject, LearningResource, PlannedItem, PlannedSession, Plan, PlanTemplate, ProblemStatus, TemplatePhase } from '../types/v2'

type RoadmapTaskSeed = (typeof roadmap.weeks)[number]['days'][number]['tasks'][number]

const toItem = (task: RoadmapTaskSeed, week: number) => ({
  type: task.type,
  title: task.title,
  minutes: task.minutes,
  metadata: {
    interview_task_id: task.id,
    interview_os: true,
    week,
    subject: task.subject,
    topic: task.topic,
    difficulty: 'difficulty' in task ? task.difficulty : undefined,
    leetcode_number: 'leetcodeNumber' in task ? task.leetcodeNumber : undefined,
    leetcode_slug: 'leetcodeSlug' in task ? task.leetcodeSlug : undefined,
    guided: 'guided' in task ? task.guided : false,
    description: 'description' in task ? task.description : undefined,
    resource_keys: 'resources' in task ? task.resources : [],
    priority: task.subject === 'REVISION' ? 'optional' : 'high',
  },
})

export const interviewPhases: TemplatePhase[] = [{
  name: 'Software Engineering Interview Preparation',
  description: 'DSA, HLD, LLD, distributed systems, revision and mock interviews.',
  start_week: 1,
  end_week: 9,
  blocks: roadmap.weeks.map((week) => ({
    name: `Week ${week.number} — ${week.title}`,
    description: `${week.startDate} to ${week.endDate}`,
    type: 'week' as const,
    week: week.number + 1,
    sessions: week.days.map((day) => {
      const mondayIndex = (new Date(`${day.date}T12:00:00`).getDay() + 6) % 7
      return {
        title: `Interview Prep — ${day.label}`,
        description: `Week ${week.number} · ${week.title}`,
        day_offset: mondayIndex - 1,
        minutes: day.tasks.reduce((sum, task) => sum + task.minutes, 0),
        items: day.tasks.map((task) => toItem(task, week.number)),
      }
    }),
  })),
}]

export const interviewTemplate: PlanTemplate = {
  id: 'study-interview',
  slug: roadmap.slug,
  domain: 'study',
  name: roadmap.name,
  short_description: 'A precise nine-week DSA, HLD, LLD, distributed-systems, revision and mock-interview operating system.',
  goal: 'Prepare for software engineering interviews',
  difficulty: 'Advanced',
  featured: true,
  sources: roadmap.resources.filter((resource) => resource.isPrimary).map((resource) => ({ title: resource.title, author_or_org: resource.provider, url: `https://${resource.providerHost}${resource.path}` })),
  version: {
    id: 'study-interview-v2', version: roadmap.version, duration_weeks: 9, days_per_week_min: 6, days_per_week_max: 7,
    expected_hours_per_week: 16, expected_session_minutes: 150,
    content: { content_status: 'complete', interview_os: true, canonical_start_date: roadmap.startDate, canonical_end_date: roadmap.endDate, phases: interviewPhases },
  },
}

export const interviewResources: LearningResource[] = roadmap.resources.map((resource) => ({
  resource_key: resource.key,
  provider: resource.provider as LearningResource['provider'],
  title: resource.title,
  provider_host: resource.providerHost,
  path: resource.path,
  resource_type: resource.resourceType,
  is_primary: resource.isPrimary,
  is_free: resource.isFree,
  topic_key: resource.topicId,
}))
export const interviewBaseline = roadmap.baseline
export const interviewRoadmapDefinition = roadmap

export function resourceHref(resource: Pick<LearningResource,'provider_host'|'path'>) { return `https://${resource.provider_host}${resource.path}` }
export function leetcodeHref(slug: string) { return `https://leetcode.com/problems/${slug}/` }

export interface InterviewTaskView { item: PlannedItem; session: PlannedSession; subject: InterviewSubject; week: number; topic: string; effectiveDate: string; overdue: boolean }

export function isInterviewRoadmap(plan:Plan|undefined,sessions:PlannedSession[]){return Boolean(plan&&(plan.template_version_id==='20000000-0000-4000-8000-000000000108'||plan.name==='Software Engineering Interview Preparation'||sessions.some((session)=>session.planned_items?.some((item)=>item.metadata.interview_os))))}

export function interviewTaskView(item: PlannedItem, session: PlannedSession, selectedDate: string): InterviewTaskView | null {
  if (!item.metadata.interview_os) return null
  const effectiveDate = item.rescheduled_for ?? session.scheduled_date
  return {
    item, session, effectiveDate,
    subject: String(item.metadata.subject ?? 'REVISION') as InterviewSubject,
    week: Number(item.metadata.week ?? 0),
    topic: String(item.metadata.topic ?? 'general'),
    overdue: effectiveDate < selectedDate && !['completed','skipped'].includes(item.status),
  }
}

export function flattenInterviewTasks(sessions: PlannedSession[], selectedDate = '9999-12-31') {
  return sessions.flatMap((session) => (session.planned_items ?? []).map((item) => interviewTaskView(item,session,selectedDate)).filter((item): item is InterviewTaskView => Boolean(item)))
}

export function interviewTodayTasks(sessions: PlannedSession[], selectedDate: string) {
  return flattenInterviewTasks(sessions,selectedDate).filter(({item,effectiveDate}) => {
    if (['completed','skipped'].includes(item.status)) return false
    if (effectiveDate === selectedDate) return true
    return effectiveDate < selectedDate && String(item.metadata.priority ?? 'high') === 'high'
  }).sort((a,b) => Number(b.overdue)-Number(a.overdue) || a.effectiveDate.localeCompare(b.effectiveDate) || a.item.position-b.item.position)
}

export function interviewProgress(sessions: PlannedSession[]) {
  const tasks = flattenInterviewTasks(sessions)
  const subjects = ['DSA','HLD','LLD','DISTRIBUTED_SYSTEMS','MOCK'] as InterviewSubject[]
  return {
    total: tasks.length,
    complete: tasks.filter(({item}) => item.status === 'completed').length,
    subjects: subjects.map((subject) => {
      const rows=tasks.filter((task)=>task.subject===subject)
      return {subject,total:rows.length,complete:rows.filter(({item})=>item.status==='completed').length}
    }),
  }
}

export function revisionOffsets(score: number) { return score <= 0 ? [1] : score === 1 ? [1,3] : score === 2 ? [3,7] : [7,21] }
export function problemStatusForScore(score: number): ProblemStatus { return score === 3 ? 'SOLVED_INDEPENDENTLY' : score === 2 ? 'SOLVED_WITH_HINT' : 'SOLVED_WITH_SOLUTION' }

export function noteFields(subject: InterviewSubject, topic: string, type: string) {
  if (subject === 'DSA') {
    const common=['Pattern','Named Algorithm','Trigger','Brute Force','Key Observation','Invariant','Algorithm','Time Complexity','Space Complexity','Edge Cases','Mistake I Made','What I Learned','Interview Explanation','Personal Notes']
    const specific=topic==='two-pointers'?['Left pointer represents','Right pointer represents','Why move left','Why move right']:topic==='sliding-window'?['Window invariant','What expands the window','What invalidates the window','When to shrink','State being maintained']:topic==='binary-search'?['Search space','Condition / predicate','mid logic','Which half is discarded','Boundary condition']:topic==='dynamic-programming'?['State','Transition','Base case','Memo / table definition','Iteration order','Final result']:[]
    return [...common,...specific]
  }
  if (subject === 'LLD') return ['Requirements','Actors','Use Cases','Entities','Responsibilities','Relationships','Interfaces','Composition vs inheritance','SOLID principles applied','Design patterns','Class diagram','Sequence diagram','Important methods','Extension points','Trade-offs','Implementation notes','Interview explanation']
  if (subject === 'HLD' || subject === 'DISTRIBUTED_SYSTEMS') return type==='design'?['Clarifying Questions','Functional Requirements','Non-functional Requirements','Capacity Estimates','Core Entities','API Design','Database Choice','High-Level Architecture','Data Flow','Scaling','Caching','Consistency','Fault Tolerance','Bottlenecks','Trade-offs','Follow-up Questions']:['Definition','Why it exists','Functional role','Non-functional impact','Scalability implications','Availability implications','Latency implications','Trade-offs','Alternatives','Common failure modes','Where used','Example systems','Interview talking points','Diagram','Open questions','Personal notes']
  return ['Outcome','What went well','What I missed','Next action','Personal Notes']
}

export function canonicalStartForTemplate(template: PlanTemplate) { return template.version.content.interview_os ? roadmap.startDate : undefined }
export function weekForDate(date:string){return date<'2026-09-07'?0:Math.max(1,Math.floor(differenceInCalendarDays(new Date(`${date}T12:00:00`),new Date('2026-09-07T12:00:00'))/7)+1)}
