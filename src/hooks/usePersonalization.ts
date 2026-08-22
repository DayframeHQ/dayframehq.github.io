import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { normalizeInterests, readDomainSetup, type DayframeInterest, type DomainSetupValue, type PersonalizationDomain } from '../lib/personalization'

export function usePersonalization() {
  const auth = useAuth()
  const metadata = auth.user?.user_metadata ?? {}
  const interests = useMemo(() => auth.isDemo ? ['everything'] as DayframeInterest[] : normalizeInterests(metadata.dayframe_interests), [auth.isDemo, metadata.dayframe_interests])
  const getDomainSetup = (domain: PersonalizationDomain) => auth.isDemo ? { completed_at: 'demo' } : readDomainSetup(metadata, domain)

  const saveInterests = async (next: DayframeInterest[]) => {
    await auth.updateUserMetadata({ dayframe_interests: next })
  }

  const saveDomainSetup = async (domain: PersonalizationDomain, values: DomainSetupValue = {}) => {
    const existing = metadata.dayframe_domain_setup && typeof metadata.dayframe_domain_setup === 'object' && !Array.isArray(metadata.dayframe_domain_setup)
      ? metadata.dayframe_domain_setup as Record<string, unknown>
      : {}
    await auth.updateUserMetadata({
      dayframe_domain_setup: {
        ...existing,
        [domain]: { ...values, completed_at: new Date().toISOString() },
      },
    })
  }

  return { interests, getDomainSetup, saveInterests, saveDomainSetup, skipDomainSetup: (domain: PersonalizationDomain) => saveDomainSetup(domain, { skipped: true }) }
}
