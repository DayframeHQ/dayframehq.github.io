export type Domain = 'train' | 'study'
export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'
export type PlannedStatus = 'planned' | 'active' | 'completed' | 'partially_completed' | 'skipped' | 'rescheduled'
export type StudyResult = 'independent' | 'hint' | 'solution_assisted' | 'partial' | 'failed' | 'completed' | 'needs_review'
export type InterviewSubject = 'DSA' | 'HLD' | 'LLD' | 'DISTRIBUTED_SYSTEMS' | 'REVISION' | 'MOCK'
export type ProblemStatus = 'UNSEEN' | 'ATTEMPTED' | 'SOLVED_WITH_SOLUTION' | 'SOLVED_WITH_HINT' | 'SOLVED_INDEPENDENTLY' | 'MASTERED'

export interface TemplateItem {
  type: string
  title: string
  minutes?: number
  metadata?: Record<string, unknown>
}

export interface TemplateSession {
  title: string
  description?: string
  day_offset: number
  minutes: number
  items: TemplateItem[]
}

export interface TemplateBlock {
  name: string
  description?: string
  type: 'week' | 'module' | 'cycle' | 'custom'
  week: number
  sessions: TemplateSession[]
}

export interface TemplatePhase {
  name: string
  description?: string
  start_week: number
  end_week: number
  blocks: TemplateBlock[]
}

export interface TemplateVersion {
  id: string
  version: string
  duration_weeks: number | null
  days_per_week_min: number | null
  days_per_week_max: number | null
  expected_hours_per_week: number | null
  expected_session_minutes: number | null
  content: { content_status?: 'complete' | 'catalog' | 'custom'; pacing?: Record<string, number>; interview_os?: boolean; canonical_start_date?: string; canonical_end_date?: string; note_schemas?: Record<string,string[]>; baseline?: Array<Record<string,unknown>>; phases: TemplatePhase[] }
  published_at?: string | null
}

export interface PlanTemplate {
  id: string
  slug: string
  domain: Domain
  name: string
  short_description: string
  goal: string
  difficulty: string
  featured: boolean
  version: TemplateVersion
  sources?: Array<{ title: string; author_or_org?: string; url?: string; description?: string }>
}

export interface Plan {
  id: string
  domain: Domain
  name: string
  goal?: string | null
  status: PlanStatus
  start_date?: string | null
  target_date?: string | null
  expected_minutes_per_week?: number | null
  template_id?: string | null
  template_version_id?: string | null
  source: 'curated_template' | 'custom' | 'imported_document'
}

export interface PlannedItem {
  id: string
  planned_session_id: string
  domain: Domain
  item_type: string
  title: string
  position: number
  estimated_minutes?: number | null
  required: boolean
  status: 'planned' | 'active' | 'completed' | 'review_needed' | 'skipped'
  study_task_id?: string | null
  metadata: Record<string, unknown>
  completed_at?: string | null
  score?: number | null
  confidence?: number | null
  needs_revision?: boolean
  attempt_count?: number
  problem_status?: ProblemStatus | null
  quick_note?: string | null
  structured_notes?: Record<string,string>
  rescheduled_for?: string | null
}

export interface PlannedSession {
  id: string
  plan_id: string
  domain: Domain
  title: string
  description?: string | null
  scheduled_date: string
  scheduled_time?: string | null
  estimated_minutes?: number | null
  status: PlannedStatus
  completed_at?: string | null
  planned_items?: PlannedItem[]
}

export interface StudySession {
  id: string
  plan_id?: string | null
  planned_session_id?: string | null
  started_at: string
  ended_at?: string | null
  session_type: 'learn' | 'practice' | 'build' | 'review' | 'explain' | 'mock' | 'read'
  planned_minutes?: number | null
  actual_minutes?: number | null
  focus_score?: number | null
  notes?: string | null
  status: 'active' | 'completed' | 'abandoned'
}

export interface StudyNote {
  id: string
  note_type: 'concept' | 'mistake' | 'solution' | 'summary' | 'design' | 'question' | 'insight'
  title: string
  content: string
  created_at: string
}

export interface StudyAttempt {
  id: string
  study_session_id: string
  study_task_id: string
  result: StudyResult
  duration_seconds?: number | null
  confidence_after?: number | null
  what_i_missed?: string | null
  score?: number | null
  problem_status?: ProblemStatus | null
  created_at: string
}

export interface LearningResource {
  id?: string
  resource_key: string
  provider: 'LEETCODE' | 'EDUCATIVE' | 'GEEKS_FOR_GEEKS' | 'SYSTEM_DESIGN_PRIMER' | 'REFACTORING_GURU'
  title: string
  provider_host: string
  path: string
  resource_type: string
  is_primary: boolean
  is_free: boolean
  topic_key?: string | null
}

export interface NutritionValues {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface NutritionSummary extends NutritionValues {
  id: string
  summary_date: string
  source: 'screenshot' | 'manual' | 'imported' | 'other'
  source_label?: string | null
  use_as_daily_total: boolean
}

export interface ProgressRange { from: string; to: string; label: string }
