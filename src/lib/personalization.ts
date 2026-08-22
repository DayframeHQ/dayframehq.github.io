export type DayframeInterest = 'train' | 'study' | 'health' | 'life' | 'everything' | 'exploring'
export type PersonalizationDomain = 'train' | 'study' | 'nutrition' | 'health'
export type QuickCategory = 'Train' | 'Study' | 'Health' | 'Life'

export interface DomainSetupValue {
  completed_at?: string
  skipped?: boolean
  [key: string]: unknown
}

export const interestOptions: Array<{ value: DayframeInterest; label: string; description: string }> = [
  { value: 'train', label: 'Training', description: 'Workouts, programs and progress' },
  { value: 'study', label: 'Study', description: 'Roadmaps, practice and review' },
  { value: 'health', label: 'Health & nutrition', description: 'Meals, recovery and biomarkers' },
  { value: 'life', label: 'Life', description: 'Goals, reminders and plans' },
  { value: 'everything', label: 'Everything', description: 'Use the complete Dayframe system' },
  { value: 'exploring', label: 'Still exploring', description: 'Start broad and decide later' },
]

const validInterests = new Set(interestOptions.map((item) => item.value))
const defaultCategories: QuickCategory[] = ['Train', 'Study', 'Health', 'Life']

export function normalizeInterests(value: unknown): DayframeInterest[] {
  if (!Array.isArray(value)) return ['everything']
  const interests = value.filter((item): item is DayframeInterest => typeof item === 'string' && validInterests.has(item as DayframeInterest))
  return interests.length ? [...new Set(interests)] : ['everything']
}

export function categoriesForInterests(interests: DayframeInterest[]): QuickCategory[] {
  if (interests.includes('everything') || interests.includes('exploring')) return defaultCategories
  const mapping: Partial<Record<DayframeInterest, QuickCategory>> = { train: 'Train', study: 'Study', health: 'Health', life: 'Life' }
  const mapped = interests.map((interest) => mapping[interest]).filter(Boolean) as QuickCategory[]
  return [...new Set(mapped)]
}

export function focusCategories(interests: DayframeInterest[]): QuickCategory[] {
  if (interests.includes('everything') || interests.includes('exploring')) return ['Train', 'Study']
  return categoriesForInterests(interests)
}

export function rankQuickAddCategories(pathname: string, interests: DayframeInterest[], scheduledDomains: string[] = []): QuickCategory[] {
  const route = pathname.startsWith('/train') ? 'Train' : pathname.startsWith('/study') ? 'Study' : pathname.startsWith('/life') ? 'Life' : pathname.startsWith('/nutrition') || pathname.startsWith('/health') ? 'Health' : undefined
  const scheduled = scheduledDomains.map((domain) => domain === 'train' ? 'Train' : domain === 'study' ? 'Study' : undefined).filter(Boolean) as QuickCategory[]
  return [...new Set([route, ...scheduled, ...categoriesForInterests(interests), ...defaultCategories].filter(Boolean) as QuickCategory[])]
}

export function readDomainSetup(metadata: unknown, domain: PersonalizationDomain): DomainSetupValue | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined
  const setup = (metadata as Record<string, unknown>).dayframe_domain_setup
  if (!setup || typeof setup !== 'object' || Array.isArray(setup)) return undefined
  const value = (setup as Record<string, unknown>)[domain]
  return value && typeof value === 'object' && !Array.isArray(value) ? value as DomainSetupValue : undefined
}
