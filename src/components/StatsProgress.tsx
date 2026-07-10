import './StatsProgress.css'

export function StatsProgress() {
  return (
    <div className="stats-progress" role="status" aria-live="polite" aria-busy="true">
      <div className="stats-progress__copy">
        <span className="eyebrow">Composition scan</span>
        <strong>Generating team stats</strong>
        <span>Checking damage balance, counter-readiness, and objective pressure…</span>
      </div>
      <div className="stats-progress__track" aria-hidden="true"><span /></div>
    </div>
  )
}
