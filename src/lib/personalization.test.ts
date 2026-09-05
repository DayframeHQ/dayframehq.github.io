import { describe, expect, it } from 'vitest'
import { categoriesForInterests, focusCategories, normalizeInterests, rankQuickAddCategories, readDomainSetup } from './personalization'

describe('progressive personalization', () => {
  it('keeps existing accounts broad when interests are missing', () => expect(normalizeInterests(undefined)).toEqual(['everything']))
  it('maps selected interests without exposing unrelated categories first', () => expect(categoriesForInterests(['study', 'life'])).toEqual(['Study', 'Life']))
  it('uses a calm two-card default for broad interests', () => expect(focusCategories(['everything'])).toEqual(['Workouts', 'Study']))
  it('ranks route, scheduled work, interests, then remaining categories', () => expect(rankQuickAddCategories('/study', ['life'], ['train'])).toEqual(['Study', 'Workouts', 'Life', 'Health']))
  it('reads completed contextual setup safely', () => expect(readDomainSetup({ dayframe_domain_setup: { train: { days: 3 } } }, 'train')).toEqual({ days: 3 }))
})
