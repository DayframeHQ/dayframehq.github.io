import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { allTemplates, studyTemplates, trainTemplates } from '../data/v2Templates'
import { dateKey } from '../lib/v2'
import { interviewBaseline, interviewResources, problemStatusForScore, revisionOffsets } from '../lib/interview'
import type { TrainExerciseOption } from '../data/trainExerciseLibrary'
import type { Domain, InterviewSubject, LearningResource, NutritionSummary, NutritionValues, Plan, PlannedItem, PlannedSession, PlanTemplate, ProblemStatus, StudyAttempt, StudyNote, StudyResult, StudySession } from '../types/v2'

interface DemoV2 {
  plans: Plan[]
  sessions: PlannedSession[]
  studySessions: StudySession[]
  attempts: StudyAttempt[]
  notes: StudyNote[]
  reviews: Array<Record<string, unknown>>
  problemAttempts: Array<Record<string, unknown>>
  summaries: NutritionSummary[]
}

const demoKey = 'dayframe_v2_demo_data'
const emptyDemo: DemoV2 = { plans: [], sessions: [], studySessions: [], attempts: [], notes: [], reviews: [], problemAttempts: [], summaries: [] }

function demoDefaults(): DemoV2 {
  const now=new Date(); const today=dateKey(now); const tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1)
  const trainPlan:Plan={id:'demo-train-plan',domain:'train',name:'4-Day Recomp — Upper/Lower',goal:'Recomp',status:'active',start_date:today,expected_minutes_per_week:270,source:'curated_template'}
  const studyPlan:Plan={id:'demo-study-plan',domain:'study',name:'Computer Science for Software Engineers',goal:'Build durable CS foundations',status:'active',start_date:today,expected_minutes_per_week:600,source:'curated_template'}
  const make=(id:string,plan:Plan,title:string,day:string,items:string[]):PlannedSession=>({id,plan_id:plan.id,domain:plan.domain,title,scheduled_date:day,estimated_minutes:plan.domain==='train'?70:75,status:'planned',planned_items:items.map((title,index)=>({id:`${id}-${index}`,planned_session_id:id,domain:plan.domain,item_type:plan.domain==='train'?'exercise':index?'practice':'lesson',title,position:index,required:true,status:'planned',study_task_id:plan.domain==='study'?`demo-task-${index}`:null,metadata:{}}))})
  return {plans:[trainPlan,studyPlan],sessions:[make('demo-train-today',trainPlan,'Upper A / Back emphasis',today,['Pull-Ups — 3 × 4–6','Lat Pulldown — 3 × 8–10','Chest-Supported Machine Row — 3 × 8–10','Incline Dumbbell Press — 3 × 8–10']),make('demo-study-today',studyPlan,'Graphs — Practice',today,['Graph representation and traversal','BFS / DFS practice','Explain cycle detection']),make('demo-study-next',studyPlan,'Graphs — Review',dateKey(tomorrow),['Explain graphs from memory','Review two missed problems'])],studySessions:[],attempts:[],notes:[{id:'demo-note',note_type:'concept',title:'BFS vs DFS',content:'BFS explores by distance; DFS follows a branch. Choice depends on the property being tested.',created_at:new Date().toISOString()}],reviews:[{id:'demo-review',topic_id:'graphs',scheduled_for:today,review_type:'recall',created_at:new Date().toISOString()}],problemAttempts:[],summaries:[]}
}

function readDemo(): DemoV2 {
  try { const stored=localStorage.getItem(demoKey);return stored?{ ...emptyDemo, ...JSON.parse(stored) as DemoV2 }:demoDefaults() } catch { return demoDefaults() }
}
function writeDemo(data: DemoV2) { localStorage.setItem(demoKey, JSON.stringify(data)); window.dispatchEvent(new Event('dayframe-v2-demo-change')) }

export interface RepoIdentity { user: User | null; isDemo: boolean }
function clientFor(identity: RepoIdentity) {
  if (identity.isDemo) return null
  if (!identity.user || !supabase) throw new Error('A signed-in Dayframe account is required.')
  return supabase
}

export async function listTemplates(identity: RepoIdentity, domain: Domain): Promise<PlanTemplate[]> {
  if (identity.isDemo) return domain === 'train' ? trainTemplates : studyTemplates
  const client = clientFor(identity)!
  const { data: templates, error } = await client.from('templates').select('*').eq('domain', domain).eq('status', 'published').order('featured', { ascending: false }).order('name')
  if (error) throw new Error(error.message)
  const ids = (templates ?? []).map((item) => item.id)
  if (!ids.length) return []
  const { data: versions, error: versionError } = await client.from('template_versions').select('*').in('template_id', ids).not('published_at', 'is', null).order('published_at', { ascending: false })
  if (versionError) throw new Error(versionError.message)
  const versionIds = (versions ?? []).map((item) => item.id)
  const { data: sources } = versionIds.length ? await client.from('template_sources').select('*').in('template_version_id', versionIds).order('position') : { data: [] }
  return (templates ?? []).flatMap((template) => {
    const version = (versions ?? []).find((item) => item.template_id === template.id)
    if (!version) return []
    return [{ ...template, short_description: template.short_description ?? '', goal: template.goal ?? '', difficulty: template.difficulty ?? '', version, sources: (sources ?? []).filter((source) => source.template_version_id === version.id) } as PlanTemplate]
  })
}

export async function copyTemplate(identity: RepoIdentity, template: PlanTemplate, startDate: string) {
  if (identity.isDemo) {
    const state = readDemo()
    const planId = crypto.randomUUID()
    const plan: Plan = { id: planId, domain: template.domain, name: template.name, goal: template.goal, status: 'active', start_date: startDate, expected_minutes_per_week: template.version.expected_hours_per_week ? template.version.expected_hours_per_week * 60 : null, template_version_id: template.version.id, source: 'curated_template' }
    const sessions: PlannedSession[] = []
    for (const phase of template.version.content.phases) for (const block of phase.blocks) for (const source of block.sessions) {
      const scheduled = new Date(`${startDate}T12:00:00`); scheduled.setDate(scheduled.getDate() + ((block.week - 1) * 7) + source.day_offset)
      const sessionId = crypto.randomUUID()
      sessions.push({ id: sessionId, plan_id: planId, domain: template.domain, title: source.title, description: source.description, scheduled_date: dateKey(scheduled), estimated_minutes: source.minutes, status: 'planned', planned_items: source.items.map((item, index) => ({ id: crypto.randomUUID(), planned_session_id: sessionId, domain: template.domain, item_type: item.type, title: item.title, position: index, estimated_minutes: item.minutes, required: true, status: 'planned', study_task_id: template.domain === 'study' ? crypto.randomUUID() : null, metadata: item.metadata ?? {} })) })
    }
    writeDemo({ ...state, plans: [...state.plans.map((item) => item.domain === template.domain && ['active','paused'].includes(item.status) ? { ...item, status: 'archived' as const } : item), plan], sessions: [...state.sessions, ...sessions] })
    return planId
  }
  const client = clientFor(identity)!
  const { data: previousPlans, error: previousPlanError } = await client.from('plans').select('id').eq('domain', template.domain).in('status', ['active','paused'])
  if (previousPlanError) throw new Error(previousPlanError.message)
  const { data, error } = await client.rpc('copy_template_version', { p_template_version_id: template.version.id, p_start_date: startDate })
  if (error) throw new Error(error.message)
  const planId = data as string
  const { error: archiveError } = await client.from('plans').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('domain', template.domain).in('status', ['active','paused']).neq('id', planId)
  if (archiveError) throw new Error(`The template was copied, but the previous plan could not be archived: ${archiveError.message}`)
  const previousIds = (previousPlans ?? []).map((item) => item.id)
  if (template.domain === 'train' && previousIds.length) {
    const { error: programError } = await client.from('workout_programs').update({ is_active: false }).in('plan_id', previousIds)
    if (programError) throw new Error(`The template was copied, but the previous workout program could not be archived: ${programError.message}`)
  }
  return planId
}

export async function resetDomainPlans(identity: RepoIdentity, domain: Domain) {
  if (identity.isDemo) {
    const state = readDemo()
    writeDemo({ ...state, plans: state.plans.map((item) => item.domain === domain && ['active','paused'].includes(item.status) ? { ...item, status: 'archived' as const } : item) })
    return
  }
  const client = clientFor(identity)!
  const { data: plans, error: planError } = await client.from('plans').select('id').eq('domain', domain).in('status', ['active','paused'])
  if (planError) throw new Error(planError.message)
  const ids = (plans ?? []).map((item) => item.id)
  if (!ids.length) return
  const { error } = await client.from('plans').update({ status: 'archived', archived_at: new Date().toISOString() }).in('id', ids)
  if (error) throw new Error(error.message)
  if (domain === 'train') {
    const { error: programError } = await client.from('workout_programs').update({ is_active: false }).in('plan_id', ids)
    if (programError) throw new Error(programError.message)
  }
}

export async function listPlans(identity: RepoIdentity, domain?: Domain): Promise<Plan[]> {
  if (identity.isDemo) return readDemo().plans.filter((item) => !domain || item.domain === domain)
  let query = clientFor(identity)!.from('plans').select('*').order('created_at', { ascending: false })
  if (domain) query = query.eq('domain', domain)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Plan[]
}

export async function updatePlan(identity:RepoIdentity,id:string,patch:Partial<Pick<Plan,'status'|'start_date'|'target_date'|'expected_minutes_per_week'|'goal'>>){
  if(identity.isDemo){const state=readDemo();writeDemo({...state,plans:state.plans.map((item)=>item.id===id?{...item,...patch}:item)});return}
  const{error}=await clientFor(identity)!.from('plans').update({...patch,archived_at:patch.status==='archived'?new Date().toISOString():undefined}).eq('id',id);if(error)throw new Error(error.message)
}

export async function listPlannedSessions(identity: RepoIdentity, from: string, to: string, domain?: Domain): Promise<PlannedSession[]> {
  if (identity.isDemo) return readDemo().sessions.filter((item) => (!domain || item.domain === domain) && item.scheduled_date >= from && item.scheduled_date <= to).sort((a,b) => a.scheduled_date.localeCompare(b.scheduled_date))
  let query = clientFor(identity)!.from('planned_sessions').select('*, planned_items(*)').gte('scheduled_date', from).lte('scheduled_date', to).order('scheduled_date').order('scheduled_time')
  if (domain) query = query.eq('domain', domain)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((session) => ({ ...session, planned_items: (session.planned_items ?? []).sort((a: PlannedItem,b: PlannedItem) => a.position-b.position) })) as PlannedSession[]
}

export async function updatePlannedSession(identity: RepoIdentity, id: string, patch: Partial<Pick<PlannedSession,'status'|'scheduled_date'|'completed_at'>>) {
  if (identity.isDemo) { const state=readDemo(); writeDemo({ ...state, sessions: state.sessions.map((item)=>item.id===id?{...item,...patch}:item) }); return }
  const { error } = await clientFor(identity)!.from('planned_sessions').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createQuickWorkoutSession(identity:RepoIdentity,input:{planId:string;scheduledDate:string;movements:TrainExerciseOption[]}){
  if(!input.movements.length)throw new Error('Choose at least one movement.')
  const sessionId=crypto.randomUUID();const estimatedMinutes=input.movements.reduce((sum,item)=>sum+(item.tracking==='duration'?(item.minutes??20):item.sets*3),0);const title=input.movements.length===1?input.movements[0].name:`Quick training · ${input.movements.length} movements`
  const plannedItems:PlannedItem[]=input.movements.map((movement,index)=>({id:crypto.randomUUID(),planned_session_id:sessionId,domain:'train',item_type:'exercise',title:movement.name,position:index,estimated_minutes:movement.tracking==='duration'?movement.minutes:movement.sets*3,required:true,status:'planned',metadata:{quick_session:true,tracking_mode:movement.tracking,activity_type:movement.activityType,sets:movement.sets,rep_min:movement.repMin,rep_max:movement.repMax,duration_minutes:movement.minutes,target_rir:2}}))
  if(identity.isDemo){const state=readDemo();const session:PlannedSession={id:sessionId,plan_id:input.planId,domain:'train',title,description:'Built from the Train quick-start movement library.',scheduled_date:input.scheduledDate,estimated_minutes:estimatedMinutes,status:'planned',planned_items:plannedItems};writeDemo({...state,sessions:[session,...state.sessions]});return session}
  const client=clientFor(identity)!;const created=await client.from('planned_sessions').insert({user_id:identity.user!.id,plan_id:input.planId,domain:'train',title,description:'Built from the Train quick-start movement library.',scheduled_date:input.scheduledDate,estimated_minutes:estimatedMinutes,status:'planned'}).select('*').single();if(created.error)throw new Error(created.error.message)
  const rows=plannedItems.map((item)=>({user_id:identity.user!.id,planned_session_id:created.data.id,domain:'train',item_type:'exercise',title:item.title,position:item.position,estimated_minutes:item.estimated_minutes,required:true,status:'planned',metadata:item.metadata}));const items=await client.from('planned_items').insert(rows).select('*').order('position');if(items.error){await client.from('planned_sessions').delete().eq('id',created.data.id);throw new Error(items.error.message)}
  return{...created.data,planned_items:items.data??[]}as PlannedSession
}

export async function startStudySession(identity: RepoIdentity, planned: PlannedSession): Promise<StudySession> {
  const item: StudySession = { id: crypto.randomUUID(), plan_id: planned.plan_id, planned_session_id: planned.id, started_at: new Date().toISOString(), session_type: planned.title.toLowerCase().includes('practice') ? 'practice' : planned.title.toLowerCase().includes('review') ? 'review' : 'learn', planned_minutes: planned.estimated_minutes, status: 'active' }
  if (identity.isDemo) { const state=readDemo(); writeDemo({ ...state, studySessions:[...state.studySessions,item], sessions:state.sessions.map((row)=>row.id===planned.id?{...row,status:'active'}:row) }); return item }
  const client=clientFor(identity)!
  const { data,error }=await client.from('study_sessions').insert({ user_id:identity.user!.id, plan_id:item.plan_id, planned_session_id:item.planned_session_id, started_at:item.started_at, session_type:item.session_type, planned_minutes:item.planned_minutes, status:'active' }).select('*').single()
  if(error) throw new Error(error.message)
  await client.from('planned_sessions').update({status:'active'}).eq('id',planned.id)
  return data as StudySession
}

export async function finishStudySession(identity: RepoIdentity, session: StudySession, focusScore: number, notes: string) {
  const ended = new Date(); const actual = Math.max(1,Math.round((ended.getTime()-new Date(session.started_at).getTime())/60000))
  if(identity.isDemo){const state=readDemo();writeDemo({...state,studySessions:state.studySessions.map((row)=>row.id===session.id?{...row,ended_at:ended.toISOString(),actual_minutes:actual,focus_score:focusScore,notes,status:'completed'}:row),sessions:state.sessions.map((row)=>row.id===session.planned_session_id?{...row,status:'completed',completed_at:ended.toISOString()}:row)});return}
  const client=clientFor(identity)!
  const {error}=await client.from('study_sessions').update({ended_at:ended.toISOString(),actual_minutes:actual,focus_score:focusScore,notes,status:'completed'}).eq('id',session.id)
  if(error) throw new Error(error.message)
  if(session.planned_session_id) await client.from('planned_sessions').update({status:'completed',completed_at:ended.toISOString()}).eq('id',session.planned_session_id)
}

export async function listStudySessions(identity: RepoIdentity, from: string, to: string) {
  if(identity.isDemo) return readDemo().studySessions.filter((item)=>item.started_at.slice(0,10)>=from&&item.started_at.slice(0,10)<=to)
  const {data,error}=await clientFor(identity)!.from('study_sessions').select('*').gte('started_at',`${from}T00:00:00`).lte('started_at',`${to}T23:59:59`).order('started_at',{ascending:false})
  if(error) throw new Error(error.message); return (data??[]) as StudySession[]
}

export async function addStudyNote(identity: RepoIdentity, input: { plan_id?: string; session_id?: string; note_type: StudyNote['note_type']; title: string; content: string }) {
  const note: StudyNote={id:crypto.randomUUID(),note_type:input.note_type,title:input.title,content:input.content,created_at:new Date().toISOString()}
  if(identity.isDemo){const state=readDemo();writeDemo({...state,notes:[note,...state.notes]});return note}
  const {data,error}=await clientFor(identity)!.from('study_notes').insert({id:note.id,user_id:identity.user!.id,...input}).select('*').single()
  if(error) throw new Error(error.message); return data as StudyNote
}

export async function listStudyNotes(identity: RepoIdentity) {
  if(identity.isDemo) return readDemo().notes
  const {data,error}=await clientFor(identity)!.from('study_notes').select('*').order('created_at',{ascending:false})
  if(error) throw new Error(error.message); return (data??[]) as StudyNote[]
}

export async function deleteStudyNote(identity: RepoIdentity,id:string){
  if(identity.isDemo){const state=readDemo();writeDemo({...state,notes:state.notes.filter((item)=>item.id!==id)});return}
  const {error}=await clientFor(identity)!.from('study_notes').delete().eq('id',id);if(error)throw new Error(error.message)
}
export async function updateStudyNote(identity:RepoIdentity,id:string,content:string){
  if(identity.isDemo){const state=readDemo();writeDemo({...state,notes:state.notes.map((item)=>item.id===id?{...item,content}:item)});return}
  const{error}=await clientFor(identity)!.from('study_notes').update({content}).eq('id',id);if(error)throw new Error(error.message)
}

export async function addStudyAttempt(identity: RepoIdentity,input:{session:StudySession;item:PlannedItem;result:StudyResult;duration_seconds:number;confidence_after:number;what_i_missed:string}){
  if(identity.isDemo){const state=readDemo();const attempt:StudyAttempt={id:crypto.randomUUID(),study_session_id:input.session.id,study_task_id:input.item.study_task_id??crypto.randomUUID(),result:input.result,duration_seconds:input.duration_seconds,confidence_after:input.confidence_after,what_i_missed:input.what_i_missed,created_at:new Date().toISOString()};writeDemo({...state,attempts:[attempt,...state.attempts],sessions:state.sessions.map((session)=>({...session,planned_items:session.planned_items?.map((item)=>item.id===input.item.id?{...item,status:'completed'}:item)}))});return attempt}
  const client=clientFor(identity)!
  let taskId=input.item.study_task_id
  if(!taskId){const {data,error}=await client.from('study_tasks').insert({user_id:identity.user!.id,is_system:false,task_type:input.item.item_type==='problem'?'problem':'custom',title:input.item.title}).select('id').single();if(error)throw new Error(error.message);taskId=data.id;await client.from('planned_items').update({study_task_id:taskId,status:'completed'}).eq('id',input.item.id)}
  else await client.from('planned_items').update({status:'completed'}).eq('id',input.item.id)
  const {data,error}=await client.from('study_attempts').insert({user_id:identity.user!.id,study_session_id:input.session.id,study_task_id:taskId,result:input.result,duration_seconds:input.duration_seconds,confidence_after:input.confidence_after,what_i_missed:input.what_i_missed}).select('*').single()
  if(error)throw new Error(error.message);return data as StudyAttempt
}

export async function listStudyAttempts(identity:RepoIdentity,from:string,to:string){
  if(identity.isDemo)return readDemo().attempts.filter((item)=>item.created_at.slice(0,10)>=from&&item.created_at.slice(0,10)<=to)
  const {data,error}=await clientFor(identity)!.from('study_attempts').select('*').gte('created_at',`${from}T00:00:00`).lte('created_at',`${to}T23:59:59`);if(error)throw new Error(error.message);return(data??[])as StudyAttempt[]
}

export async function scheduleStudyReview(identity:RepoIdentity,input:{task_id?:string;note_id?:string;scheduled_for:string}){
  if(identity.isDemo){const state=readDemo();writeDemo({...state,reviews:[{id:crypto.randomUUID(),...input,review_type:'recall',created_at:new Date().toISOString()},...state.reviews]});return}
  const {error}=await clientFor(identity)!.from('study_reviews').insert({user_id:identity.user!.id,...input,review_type:'recall'});if(error)throw new Error(error.message)
}

export async function listReviews(identity:RepoIdentity,from:string,to:string){
  if(identity.isDemo)return readDemo().reviews.filter((item)=>String(item.scheduled_for)>=from&&String(item.scheduled_for)<=to)
  const {data,error}=await clientFor(identity)!.from('study_reviews').select('*').gte('scheduled_for',from).lte('scheduled_for',to).order('scheduled_for');if(error)throw new Error(error.message);return data??[]
}

export async function listResources(identity:RepoIdentity){
  if(identity.isDemo)return allTemplates.filter((item)=>item.domain==='study').flatMap((item)=>item.sources??[])
  const client=clientFor(identity)!;const[owned,sources]=await Promise.all([client.from('study_resources').select('*').order('is_system',{ascending:false}).order('title'),client.from('template_sources').select('*').order('position')]);if(owned.error||sources.error)throw new Error(owned.error?.message??sources.error?.message??'Resources could not load');return[...(owned.data??[]),...(sources.data??[]).map((item)=>({...item,provider:item.author_or_org}))]
}

export async function listLearningResources(identity:RepoIdentity):Promise<LearningResource[]>{
  if(identity.isDemo)return interviewResources
  const {data,error}=await clientFor(identity)!.from('learning_resources').select('*').order('is_primary',{ascending:false}).order('title')
  if(error)throw new Error(error.message);return(data??[])as LearningResource[]
}

type InterviewItemPatch=Partial<Pick<PlannedItem,'status'|'completed_at'|'score'|'confidence'|'needs_revision'|'attempt_count'|'problem_status'|'quick_note'|'structured_notes'|'rescheduled_for'|'metadata'>>
export async function updateInterviewItem(identity:RepoIdentity,id:string,patch:InterviewItemPatch){
  if(identity.isDemo){const state=readDemo();writeDemo({...state,sessions:state.sessions.map((session)=>({...session,planned_items:session.planned_items?.map((item)=>item.id===id?{...item,...patch}:item)}))});return}
  const {error}=await clientFor(identity)!.from('planned_items').update(patch).eq('id',id);if(error)throw new Error(error.message)
}

export async function recordInterviewProblem(identity:RepoIdentity,input:{item:PlannedItem;score:number;durationMinutes:number;confidence:number;notes:string}){
  const score=Math.max(0,Math.min(3,input.score));const problemStatus=problemStatusForScore(score);const now=new Date();const needsRevision=score<=2
  const patch:InterviewItemPatch={status:'completed',completed_at:now.toISOString(),score,confidence:input.confidence,needs_revision:needsRevision,attempt_count:(input.item.attempt_count??0)+1,problem_status:problemStatus,quick_note:input.notes||input.item.quick_note}
  const reviewDates=revisionOffsets(score).map((days)=>{const date=new Date(now);date.setDate(date.getDate()+days);return dateKey(date)})
  if(identity.isDemo){const state=readDemo();const attempt={id:crypto.randomUUID(),planned_item_id:input.item.id,attempt_number:patch.attempt_count,result:problemStatus,score,duration_minutes:input.durationMinutes,confidence:input.confidence,notes:input.notes,attempted_at:now.toISOString()};const reviews=input.item.study_task_id?reviewDates.map((scheduled_for,index)=>({id:crypto.randomUUID(),task_id:input.item.study_task_id,scheduled_for,review_type:score<=1||index>0?'reimplement':'explain',created_at:now.toISOString()})):[];writeDemo({...state,problemAttempts:[attempt,...state.problemAttempts],reviews:[...reviews,...state.reviews.filter((review)=>review.task_id!==input.item.study_task_id||Boolean(review.completed_at))],sessions:state.sessions.map((session)=>({...session,planned_items:session.planned_items?.map((item)=>item.id===input.item.id?{...item,...patch}:item)}))});return}
  const client=clientFor(identity)!;const {error}=await client.from('planned_items').update(patch).eq('id',input.item.id);if(error)throw new Error(error.message)
  const {error:attemptError}=await client.from('problem_attempts').insert({user_id:identity.user!.id,planned_item_id:input.item.id,attempt_number:patch.attempt_count,result:problemStatus,score,duration_minutes:input.durationMinutes,confidence:input.confidence,notes:input.notes});if(attemptError)throw new Error(attemptError.message)
  if(input.item.study_task_id){const {error:clearError}=await client.from('study_reviews').delete().eq('task_id',input.item.study_task_id).is('completed_at',null);if(clearError)throw new Error(clearError.message);const rows=reviewDates.map((scheduled_for,index)=>({user_id:identity.user!.id,task_id:input.item.study_task_id,scheduled_for,review_type:score<=1||index>0?'reimplement':'explain'}));const {error:reviewError}=await client.from('study_reviews').insert(rows);if(reviewError)throw new Error(reviewError.message)}
}

export async function listProblemAttempts(identity:RepoIdentity,itemId:string){
  if(identity.isDemo)return readDemo().problemAttempts.filter((item)=>item.planned_item_id===itemId)
  const {data,error}=await clientFor(identity)!.from('problem_attempts').select('*').eq('planned_item_id',itemId).order('attempted_at',{ascending:false});if(error)throw new Error(error.message);return data??[]
}

export async function listItemReviews(identity:RepoIdentity,taskId:string){
  if(identity.isDemo)return readDemo().reviews.filter((item)=>item.task_id===taskId).sort((a,b)=>String(a.scheduled_for).localeCompare(String(b.scheduled_for)))
  const {data,error}=await clientFor(identity)!.from('study_reviews').select('*').eq('task_id',taskId).order('scheduled_for');if(error)throw new Error(error.message);return data??[]
}

export async function addCustomInterviewTask(identity:RepoIdentity,input:{planId:string;scheduledDate:string;subject:InterviewSubject;title:string;minutes:number;leetcodeSlug?:string;difficulty?:string}){
  const isProblem=Boolean(input.leetcodeSlug);const metadata={interview_os:true,interview_task_id:`custom-${crypto.randomUUID()}`,week:null,subject:isProblem?'DSA':input.subject,topic:'custom',priority:'optional',resource_keys:[],leetcode_slug:input.leetcodeSlug||undefined,difficulty:input.difficulty||undefined}
  if(identity.isDemo){const state=readDemo();const existing=state.sessions.find((session)=>session.plan_id===input.planId&&session.scheduled_date===input.scheduledDate);const item:PlannedItem={id:crypto.randomUUID(),planned_session_id:existing?.id??crypto.randomUUID(),domain:'study',item_type:isProblem?'problem':'custom',title:input.title,position:existing?.planned_items?.length??0,estimated_minutes:input.minutes,required:false,status:'planned',study_task_id:crypto.randomUUID(),metadata};if(existing)writeDemo({...state,sessions:state.sessions.map((session)=>session.id===existing.id?{...session,planned_items:[...(session.planned_items??[]),item]}:session)});else writeDemo({...state,sessions:[...state.sessions,{id:item.planned_session_id,plan_id:input.planId,domain:'study',title:'Custom interview tasks',scheduled_date:input.scheduledDate,estimated_minutes:input.minutes,status:'planned',planned_items:[item]}]});return}
  const client=clientFor(identity)!;const {data:existingSession,error:sessionError}=await client.from('planned_sessions').select('id').eq('plan_id',input.planId).eq('scheduled_date',input.scheduledDate).limit(1).maybeSingle();if(sessionError)throw new Error(sessionError.message);let session=existingSession
  if(!session){const created=await client.from('planned_sessions').insert({user_id:identity.user!.id,plan_id:input.planId,domain:'study',title:'Custom interview tasks',scheduled_date:input.scheduledDate,estimated_minutes:input.minutes,status:'planned'}).select('id').single();if(created.error)throw new Error(created.error.message);session=created.data}
  const task=await client.from('study_tasks').insert({user_id:identity.user!.id,is_system:false,task_type:isProblem?'problem':'custom',title:input.title,estimated_minutes:input.minutes,metadata}).select('id').single();if(task.error)throw new Error(task.error.message)
  const {error}=await client.from('planned_items').insert({user_id:identity.user!.id,planned_session_id:session.id,domain:'study',item_type:isProblem?'problem':'custom',title:input.title,position:999,estimated_minutes:input.minutes,required:false,status:'planned',study_task_id:task.data.id,metadata});if(error)throw new Error(error.message)
}

export async function applyInterviewBaseline(identity:RepoIdentity,planId:string){
  if(identity.isDemo){const state=readDemo();if(state.sessions.some((session)=>session.plan_id===planId&&session.title==='Interview Prep — Prior progress'))return;const sessionId=crypto.randomUUID();const items:PlannedItem[]=interviewBaseline.map((seed,index)=>({id:crypto.randomUUID(),planned_session_id:sessionId,domain:'study',item_type:seed.type,title:seed.title,position:index,estimated_minutes:seed.minutes,required:true,status:seed.initialStatus==='COMPLETED'?'completed':'active',study_task_id:crypto.randomUUID(),score:seed.score,problem_status:seed.problemStatus as ProblemStatus,completed_at:seed.initialStatus==='COMPLETED'?'2026-08-31T18:00:00.000Z':null,metadata:{interview_os:true,interview_task_id:seed.id,week:-1,subject:seed.subject,topic:seed.topic,difficulty:'difficulty'in seed?seed.difficulty:undefined,leetcode_number:'leetcodeNumber'in seed?seed.leetcodeNumber:undefined,leetcode_slug:'leetcodeSlug'in seed?seed.leetcodeSlug:undefined,priority:'high',resource_keys:[]}}));writeDemo({...state,sessions:[...state.sessions,{id:sessionId,plan_id:planId,domain:'study',title:'Interview Prep — Prior progress',description:'Imported Aug 31 baseline',scheduled_date:'2026-08-31',estimated_minutes:items.reduce((sum,item)=>sum+(item.estimated_minutes??0),0),status:'partially_completed',planned_items:items}]});return}
  const client=clientFor(identity)!;const existing=await client.from('planned_sessions').select('id').eq('plan_id',planId).eq('title','Interview Prep — Prior progress').maybeSingle();if(existing.error)throw new Error(existing.error.message);if(existing.data)return
  const session=await client.from('planned_sessions').insert({user_id:identity.user!.id,plan_id:planId,domain:'study',title:'Interview Prep — Prior progress',description:'Imported Aug 31 baseline',scheduled_date:'2026-08-31',estimated_minutes:interviewBaseline.reduce((sum,item)=>sum+item.minutes,0),status:'partially_completed'}).select('id').single();if(session.error)throw new Error(session.error.message)
  for(const [index,seed]of interviewBaseline.entries()){const metadata={interview_os:true,interview_task_id:seed.id,week:-1,subject:seed.subject,topic:seed.topic,difficulty:'difficulty'in seed?seed.difficulty:undefined,leetcode_number:'leetcodeNumber'in seed?seed.leetcodeNumber:undefined,leetcode_slug:'leetcodeSlug'in seed?seed.leetcodeSlug:undefined,priority:'high',resource_keys:[]};const task=await client.from('study_tasks').insert({user_id:identity.user!.id,is_system:false,task_type:seed.type==='problem'?'problem':'custom',title:seed.title,estimated_minutes:seed.minutes,metadata}).select('id').single();if(task.error)throw new Error(task.error.message);const {error}=await client.from('planned_items').insert({user_id:identity.user!.id,planned_session_id:session.data.id,domain:'study',item_type:seed.type,title:seed.title,position:index,estimated_minutes:seed.minutes,required:true,status:seed.initialStatus==='COMPLETED'?'completed':'active',study_task_id:task.data.id,score:seed.score,problem_status:seed.problemStatus,completed_at:seed.initialStatus==='COMPLETED'?'2026-08-31T18:00:00.000Z':null,metadata});if(error)throw new Error(error.message)}
}

export async function getNutritionSummary(identity:RepoIdentity,date:string):Promise<NutritionSummary|null>{
  if(identity.isDemo)return readDemo().summaries.find((item)=>item.summary_date===date)??null
  const {data,error}=await clientFor(identity)!.from('daily_nutrition_summaries').select('*').eq('summary_date',date).maybeSingle();if(error)throw new Error(error.message)
  return data?{id:data.id,summary_date:data.summary_date,calories:Number(data.calories),protein:Number(data.protein_g),carbs:Number(data.carbs_g),fat:Number(data.fat_g),fiber:Number(data.fiber_g??0),source:data.source,source_label:data.source_label,use_as_daily_total:data.use_as_daily_total}:null
}

export async function saveNutritionSummary(identity:RepoIdentity,date:string,values:NutritionValues,source:NutritionSummary['source']='manual'){
  const item:NutritionSummary={id:crypto.randomUUID(),summary_date:date,...values,source,use_as_daily_total:true}
  if(identity.isDemo){const state=readDemo();writeDemo({...state,summaries:[...state.summaries.filter((row)=>row.summary_date!==date),item]});return item}
  const {data,error}=await clientFor(identity)!.from('daily_nutrition_summaries').upsert({user_id:identity.user!.id,summary_date:date,calories:values.calories,protein_g:values.protein,carbs_g:values.carbs,fat_g:values.fat,fiber_g:values.fiber,source,use_as_daily_total:true},{onConflict:'user_id,summary_date'}).select('*').single();if(error)throw new Error(error.message);return data
}

export async function setNutritionMode(identity:RepoIdentity,id:string,useSummary:boolean){
  if(identity.isDemo){const state=readDemo();writeDemo({...state,summaries:state.summaries.map((item)=>item.id===id?{...item,use_as_daily_total:useSummary}:item)});return}
  const {error}=await clientFor(identity)!.from('daily_nutrition_summaries').update({use_as_daily_total:useSummary}).eq('id',id);if(error)throw new Error(error.message)
}

export async function getNutritionPreferences(identity:RepoIdentity){
  if(identity.isDemo)return{calorie_target:2200,protein_target_g:140,carbs_target_g:240,fat_target_g:70,fiber_target_g:30,steps_target:8000,hydration_target_ml:2200,leetcode_profile_url:''}
  const {data,error}=await clientFor(identity)!.from('user_preferences').select('calorie_target,protein_target_g,carbs_target_g,fat_target_g,fiber_target_g,steps_target,hydration_target_ml,leetcode_profile_url').maybeSingle();if(error)throw new Error(error.message);return data
}

export async function listRecipes(identity:RepoIdentity){
  if(identity.isDemo)return[]
  const {data,error}=await clientFor(identity)!.from('recipes').select('*, recipe_ingredients(*, foods(*))').order('created_at',{ascending:false});if(error)throw new Error(error.message);return data??[]
}

export async function saveRecipe(identity:RepoIdentity,input:{name:string;servings:number;ingredients:Array<{name:string;calories:number;protein:number}>}){
  if(identity.isDemo){localStorage.setItem(`dayframe_demo_recipe_${crypto.randomUUID()}`,JSON.stringify(input));return}
  const client=clientFor(identity)!;const {data:recipe,error}=await client.from('recipes').insert({user_id:identity.user!.id,name:input.name,servings:input.servings}).select('id').single();if(error||!recipe)throw new Error(error?.message??'Recipe could not be created')
  const foodRows=input.ingredients.map((item)=>({user_id:identity.user!.id,name:item.name,serving_unit:'recipe amount',calories:item.calories,protein_g:item.protein,source:'user_entered'}));const {data:foods,error:foodsError}=await client.from('foods').insert(foodRows).select('id');if(foodsError){await client.from('recipes').delete().eq('id',recipe.id);throw new Error(foodsError.message)}
  const {error:linkError}=await client.from('recipe_ingredients').insert((foods??[]).map((food)=>({user_id:identity.user!.id,recipe_id:recipe.id,food_id:food.id,quantity:1})));if(linkError){await client.from('recipes').delete().eq('id',recipe.id);throw new Error(linkError.message)}
}

interface ProgressData { planned: PlannedSession[]; studySessions: StudySession[]; attempts: StudyAttempt[]; workouts: Array<Record<string, unknown> & {id:string;status:string;session_date:string;exercise_logs?:Array<Record<string,unknown>>}>; sets: Array<Record<string,unknown>&{completed?:boolean}>; body: Array<Record<string,unknown>>; activity: Array<Record<string,unknown>> }
export async function getProgressData(identity:RepoIdentity,from:string,to:string):Promise<ProgressData>{
  if(identity.isDemo){const state=readDemo();return{planned:state.sessions.filter((item)=>item.scheduled_date>=from&&item.scheduled_date<=to),studySessions:state.studySessions.filter((item)=>item.started_at.slice(0,10)>=from&&item.started_at.slice(0,10)<=to),attempts:state.attempts.filter((item)=>item.created_at.slice(0,10)>=from&&item.created_at.slice(0,10)<=to),workouts:[],sets:[],body:[],activity:[]}}
  const client=clientFor(identity)!
  const [planned,studySessions,attempts,workouts,body,activity]=await Promise.all([
    client.from('planned_sessions').select('*').gte('scheduled_date',from).lte('scheduled_date',to),
    client.from('study_sessions').select('*').gte('started_at',`${from}T00:00:00`).lte('started_at',`${to}T23:59:59`),
    client.from('study_attempts').select('*').gte('created_at',`${from}T00:00:00`).lte('created_at',`${to}T23:59:59`),
    client.from('workout_sessions').select('*, exercise_logs(*, set_logs(*))').gte('session_date',from).lte('session_date',to),
    client.from('body_measurements').select('*').gte('measured_at',`${from}T00:00:00`).lte('measured_at',`${to}T23:59:59`).order('measured_at'),
    client.from('activity_logs').select('*').gte('activity_date',from).lte('activity_date',to).order('activity_date'),
  ])
  const error=[planned,studySessions,attempts,workouts,body,activity].find((item)=>item.error)?.error;if(error)throw new Error(error.message)
  const workoutRows=workouts.data??[]
  return{planned:(planned.data??[])as PlannedSession[],studySessions:(studySessions.data??[])as StudySession[],attempts:(attempts.data??[])as StudyAttempt[],workouts:workoutRows as ProgressData['workouts'],sets:workoutRows.flatMap((workout)=>workout.exercise_logs??[]).flatMap((log:Record<string,unknown>)=>(log.set_logs??[]) as ProgressData['sets']),body:body.data??[],activity:activity.data??[]}
}

const demoLifeKey='dayframe_v2_demo_life'
interface LifeExtended {projects:Array<{id:string;title:string;next_action?:string;progress?:number}>;wishes:Array<{id:string;title:string;status:string;notes?:string}>;notes:Array<{id:string;note_date:string;title?:string;content:string}>}
export async function listLifeExtended(identity:RepoIdentity):Promise<LifeExtended>{
  if(identity.isDemo){try{return JSON.parse(localStorage.getItem(demoLifeKey)??'{"projects":[],"wishes":[],"notes":[]}') as LifeExtended}catch{return{projects:[],wishes:[],notes:[]}}}
  const client=clientFor(identity)!;const[projects,wishes,notes]=await Promise.all([client.from('projects').select('*').order('created_at',{ascending:false}),client.from('wishes').select('*').order('created_at',{ascending:false}),client.from('notes').select('*').order('note_date',{ascending:false})]);const error=[projects,wishes,notes].find((item)=>item.error)?.error;if(error)throw new Error(error.message);return{projects:projects.data??[],wishes:wishes.data??[],notes:notes.data??[]}
}
export async function addLifeRecord(identity:RepoIdentity,input:{kind:'project'|'wish'|'note';title:string;detail?:string}){
  if(identity.isDemo){const state=await listLifeExtended(identity);if(input.kind==='project')state.projects=[{id:crypto.randomUUID(),title:input.title,next_action:input.detail,progress:0},...state.projects];if(input.kind==='wish')state.wishes=[{id:crypto.randomUUID(),title:input.title,status:'Idea',notes:input.detail},...state.wishes];if(input.kind==='note')state.notes=[{id:crypto.randomUUID(),note_date:dateKey(),title:input.title,content:input.detail??''},...state.notes];localStorage.setItem(demoLifeKey,JSON.stringify(state));window.dispatchEvent(new Event('dayframe-v2-demo-change'));return}
  const client=clientFor(identity)!;let error: {message:string}|null=null
  if(input.kind==='project')({error}=await client.from('projects').insert({user_id:identity.user!.id,title:input.title,next_action:input.detail,status:'active'}))
  if(input.kind==='wish')({error}=await client.from('wishes').insert({user_id:identity.user!.id,title:input.title,notes:input.detail,status:'Idea'}))
  if(input.kind==='note')({error}=await client.from('notes').insert({user_id:identity.user!.id,note_date:dateKey(),title:input.title,content:input.detail??''}))
  if(error)throw new Error(error.message)
}

export function resetDemoV2(){localStorage.removeItem(demoKey);window.dispatchEvent(new Event('dayframe-v2-demo-change'))}
