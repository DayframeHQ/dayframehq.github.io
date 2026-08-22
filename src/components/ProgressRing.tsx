interface ProgressRingProps {
  value: number
  size?: number
  label?: string
}

export function ProgressRing({ value, size = 58, label }: ProgressRingProps) {
  const normalized = Math.min(100, Math.max(0, value))
  const radius = 23
  const circumference = 2 * Math.PI * radius
  return (
    <div style={{ width: size, height: size, position: 'relative', flex: '0 0 auto' }} aria-label={label ?? `${normalized}% complete`}>
      <svg width={size} height={size} viewBox="0 0 58 58" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="29" cy="29" r={radius} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="6" />
        <circle cx="29" cy="29" r={radius} fill="none" stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - normalized / 100)} />
      </svg>
      <strong style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 12 }}>{normalized}%</strong>
    </div>
  )
}
