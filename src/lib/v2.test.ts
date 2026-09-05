import { describe, expect, it } from 'vitest'
import { independentSolveRate, mapAttemptLabel, noDataLabel, nutritionTotal, planImportSchema, progressRange, progressionSuggestion, quickAddCategories, reviewDate, selectLatestPublishedVersion, templateCopyCounts } from './v2'
import type { NutritionSummary, TemplateVersion } from '../types/v2'

const summary: NutritionSummary={id:'s',summary_date:'2026-08-22',calories:2100,protein:140,carbs:220,fat:70,fiber:30,source:'manual',use_as_daily_total:true}
const version=(published_at:string|null,phases:TemplateVersion['content']['phases']=[]):TemplateVersion=>({id:published_at??'draft',version:'1',duration_weeks:1,days_per_week_min:1,days_per_week_max:1,expected_hours_per_week:1,expected_session_minutes:60,published_at,content:{phases}})

describe('V2 correctness rules',()=>{
  it('never adds an authoritative summary to meal totals',()=>expect(nutritionTotal(summary,[{calories:500,protein:30}])).toMatchObject({calories:2100,protein:140,source:'summary'}))
  it('sums itemized meals when a summary is not authoritative',()=>expect(nutritionTotal({...summary,use_as_daily_total:false},[{calories:500,protein:30,fiber:5},{calories:700,protein:40,fiber:8}])).toMatchObject({calories:1200,protein:70,fiber:13,source:'items'}))
  it('normalizes only supported attempt outcomes',()=>{expect(mapAttemptLabel('independent')).toBe('independent');expect(mapAttemptLabel('magical')).toBe('needs_review')})
  it('calculates transparent independent solve rate',()=>expect(independentSolveRate([{result:'independent'},{result:'hint'},{result:'completed'}])).toBe(50))
  it('returns an honest no-data progress label',()=>expect(noDataLabel(0)).toBe('Not enough data yet'))
  it('selects the newest published immutable version',()=>expect(selectLatestPublishedVersion([version(null),version('2026-01-01'),version('2026-08-01')])?.published_at).toBe('2026-08-01'))
  it('suggests progression only when every completed set reaches the top range',()=>{expect(progressionSuggestion([{completed:true,reps:10,rir:2},{completed:true,reps:10,rir:1}],10)).toContain('load increase');expect(progressionSuggestion([{completed:true,reps:9,rir:2}],10)).toBeNull()})
  it('uses explicit review intervals',()=>expect(reviewDate('21d',new Date('2026-08-01T12:00:00'))).toBe('2026-08-22'))
  it('keeps Quick Add first-level categories narrow',()=>expect(quickAddCategories).toEqual(['Recent','Workouts','Study','Health','Life']))
  it('rejects malformed imported plan output',()=>expect(planImportSchema.safeParse({plan:{name:'',domain:'study'},phases:[],blocks:[],sessions:[],items:[],resources:[]}).success).toBe(false))
  it('maps all normalized template copy rows',()=>{const phases=[{name:'P',start_week:1,end_week:1,blocks:[{name:'W',type:'week' as const,week:1,sessions:[{title:'S',day_offset:0,minutes:60,items:[{type:'lesson',title:'I'}]}]}]}];expect(templateCopyCounts(version('2026-08-01',phases))).toEqual({phases:1,blocks:1,sessions:1,items:1})})
  it('builds range filters with real inclusive date boundaries',()=>expect(progressRange('7D',new Date('2026-08-22T12:00:00'))).toEqual({from:'2026-08-16',to:'2026-08-22',label:'7D'}))
})
