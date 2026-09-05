import { CalendarCheck, Copy, Info, ListChecks } from 'lucide-react'

type TemplateDomain = 'train' | 'study'

const guideCopy = {
  train: {
    eyebrow: 'How workout templates work',
    title: 'A researched starting point—not a rigid prescription.',
    description: 'Dayframe turns established hypertrophy principles such as appropriate weekly volume, progressive overload, proximity to failure and recovery into a schedule you can actually follow. The catalog is informed by peer-reviewed research and public education from evidence-based communicators including Jeff Nippard and Andrew Huberman; they do not endorse or sponsor Dayframe.',
    choose: 'Tell us your goal, experience, available days and equipment. Exact day matches are ranked first.',
    copy: 'Preview a program, then copy it. Dayframe creates a private plan and schedule; the published original never changes.',
    track: 'Open Today, complete the prescribed sets, and record weight, reps and effort. Your logs stay attached to your account.',
  },
  study: {
    eyebrow: 'How study templates work',
    title: 'A roadmap designed for durable learning.',
    description: 'Dayframe roadmaps organize active recall, deliberate practice, spaced review and project work into a realistic sequence. They are curated from learning science and reputable open educational material, including university courses and primary documentation; no listed source endorses or sponsors Dayframe.',
    choose: 'Tell us what you are studying, your current level, your outcome and weekly time. Dayframe uses that context to order suitable roadmaps.',
    copy: 'Preview a roadmap, then copy it. The copy becomes your private schedule and can be adjusted without changing the public template.',
    track: 'Start sessions from Today, log task outcomes and gaps, keep notes, and schedule reviews. Progress comes only from work you record.',
  },
} satisfies Record<TemplateDomain, Record<string, string>>

export function TemplateGuide({ domain }: { domain: TemplateDomain }) {
  const content = guideCopy[domain]
  return <details className="template-guide card" open>
    <summary>
      <span className="info-icon" aria-hidden="true"><Info size={18}/></span>
      <span><span className="eyebrow">{content.eyebrow}</span><strong>{content.title}</strong></span>
      <span className="tiny muted template-guide-hint">Tap to {domain === 'train' ? 'learn' : 'understand'}</span>
    </summary>
    <div className="template-guide-body">
      <p className="muted small">{content.description}</p>
      <div className="template-steps">
        <div><ListChecks size={18}/><span><strong>1. Personalize</strong><small>{content.choose}</small></span></div>
        <div><Copy size={18}/><span><strong>2. Preview and copy</strong><small>{content.copy}</small></span></div>
        <div><CalendarCheck size={18}/><span><strong>3. Follow and track</strong><small>{content.track}</small></span></div>
      </div>
      <p className="tiny muted template-guide-note">Changing templates later archives the active copy and preserves completed history. It does not delete your records.</p>
    </div>
  </details>
}
