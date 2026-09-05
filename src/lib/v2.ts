import { addDays, format, subDays, subMonths, subYears } from 'date-fns'
import type { NutritionSummary, NutritionValues, ProgressRange, StudyAttempt, StudyResult } from '../types/v2'
import { z } from 'zod'
import type { TemplateVersion } from '../types/v2'

export const dateKey = (date = new Date()) => format(date, 'yyyy-MM-dd')

export function nutritionTotal(summary: NutritionSummary | null | undefined, meals: Array<Partial<NutritionValues>>) {
  if (summary?.use_as_daily_total) return { calories: summary.calories, protein: summary.protein, carbs: summary.carbs, fat: summary.fat, fiber: summary.fiber, source: 'summary' as const }
  return meals.reduce<{calories:number;protein:number;carbs:number;fat:number;fiber:number;source:'items'}>((sum, meal) => ({
    calories: sum.calories + Number(meal.calories ?? 0), protein: sum.protein + Number(meal.protein ?? 0),
    carbs: sum.carbs + Number(meal.carbs ?? 0), fat: sum.fat + Number(meal.fat ?? 0), fiber: sum.fiber + Number(meal.fiber ?? 0), source: 'items' as const,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, source: 'items' as const })
}

export function independentSolveRate(attempts: Array<Pick<StudyAttempt, 'result'>>) {
  const problemAttempts = attempts.filter((attempt) => ['independent','hint','solution_assisted','partial','failed'].includes(attempt.result))
  return problemAttempts.length ? Math.round(problemAttempts.filter((attempt) => attempt.result === 'independent').length / problemAttempts.length * 100) : null
}

export function mapAttemptLabel(value: string): StudyResult {
  const allowed: StudyResult[] = ['independent','hint','solution_assisted','partial','failed','completed','needs_review']
  return allowed.includes(value as StudyResult) ? value as StudyResult : 'needs_review'
}

export function reviewDate(option: 'tomorrow' | '3d' | '7d' | '21d', from = new Date()) {
  const days = option === 'tomorrow' ? 1 : option === '3d' ? 3 : option === '7d' ? 7 : 21
  return dateKey(addDays(from, days))
}

export function progressionSuggestion(sets: Array<{ completed: boolean; reps: number; rir: number }>, repMax: number) {
  if (!sets.length || !sets.every((set) => set.completed)) return null
  return sets.every((set) => set.reps >= repMax && set.rir >= 1)
    ? 'All working sets reached the top of the range with reps in reserve. Consider a small load increase next time.'
    : null
}

export function progressRange(value: '7D' | '30D' | '3M' | '6M' | '1Y', now = new Date()): ProgressRange {
  const from = value === '7D' ? subDays(now, 6) : value === '30D' ? subDays(now, 29) : value === '3M' ? subMonths(now, 3) : value === '6M' ? subMonths(now, 6) : subYears(now, 1)
  return { from: dateKey(from), to: dateKey(now), label: value }
}

export function noDataLabel(count: number) { return count ? null : 'Not enough data yet' }

export const quickAddCategories = ['Recent', 'Workouts', 'Study', 'Health', 'Life'] as const

export function selectLatestPublishedVersion(versions: TemplateVersion[]) {
  return versions.filter((item)=>item.published_at).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)))[0]??null
}

export function templateCopyCounts(version:TemplateVersion){
  const phases=version.content.phases;const blocks=phases.flatMap((item)=>item.blocks);const sessions=blocks.flatMap((item)=>item.sessions);const items=sessions.flatMap((item)=>item.items)
  return{phases:phases.length,blocks:blocks.length,sessions:sessions.length,items:items.length}
}

export const planImportSchema=z.object({
  plan:z.object({name:z.string().min(1).max(160),domain:z.enum(['study','train'])}),
  phases:z.array(z.object({key:z.string().min(1),name:z.string().min(1)})).max(100),
  blocks:z.array(z.object({key:z.string().min(1),phase_key:z.string().min(1),name:z.string().min(1),position:z.number().int().nonnegative()})).max(1000),
  sessions:z.array(z.object({key:z.string().min(1),block_key:z.string().min(1),title:z.string().min(1),estimated_minutes:z.number().int().positive().max(1440).optional()})).max(5000),
  items:z.array(z.object({session_key:z.string().min(1),title:z.string().min(1),type:z.string().min(1)})).max(20000),
  resources:z.array(z.object({title:z.string().min(1),url:z.string().url().optional()})).max(1000),
})
