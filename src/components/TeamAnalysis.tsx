import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Ratings, TeamAnalysis, Tier } from '../core/types'
import { ARCHETYPE_META } from '../core/draft'
import './TeamAnalysis.css'

const TIER_COLOR: Record<Tier, string> = { S:'#ffd56b', A:'#0ac8b9', B:'#4e9be8', C:'#9aa4ad', D:'#c08552', F:'#c14b4b' }
const TIER_LABEL: Record<Tier, string> = { S:'Exceptional', A:'Strong', B:'Solid', C:'Workable', D:'Weak', F:'Poor' }

const BARS: { key: keyof Ratings; label: string }[] = [
  { key:'damage',          label:'Damage' },
  { key:'tank',            label:'Frontline' },
  { key:'cc',              label:'Crowd Control' },
  { key:'engage',          label:'Engage' },
  { key:'earlyGame',       label:'Early Game' },
  { key:'lateGame',        label:'Late Game' },
  { key:'poke',            label:'Poke' },
  { key:'disengage',       label:'Disengage' },
  { key:'objectiveControl',label:'Objectives' },
]

const RADAR_AXES: { key: keyof Ratings; label: string }[] = [
  { key: 'damage', label: 'Damage' },
  { key: 'engage', label: 'Engage' },
  { key: 'tank', label: 'Frontline' },
  { key: 'lateGame', label: 'Scaling' },
  { key: 'disengage', label: 'Peel' },
  { key: 'cc', label: 'Control' },
]

export function TeamAnalysis({ analysis, onClose }: { analysis: TeamAnalysis; onClose?: () => void }) {
  const archMeta = ARCHETYPE_META[analysis.archetype as keyof typeof ARCHETYPE_META]
  const tierColor = TIER_COLOR[analysis.tier]

  return (
    <div className="analysis">
      <div className="analysis__hero">
        <div className="analysis__heading">
          <span className="analysis__arch-mark" style={{ color: archMeta.color, background: `${archMeta.color}14`, borderColor: `${archMeta.color}55` }}>
            <ArchetypeIcon archetype={analysis.archetype} />
          </span>
          <div>
            <span className="analysis__kicker">Composition analysis</span>
            <h2 className="analysis__arch-label">{analysis.archetypeLabel}</h2>
            <p className="analysis__arch-desc">{analysis.archetypeDesc}</p>
          </div>
        </div>

        <div className="analysis__hero-right">
          {onClose && <button type="button" className="analysis__close" onClick={onClose} aria-label="Close team statistics"><CloseIcon /> Close</button>}
          <div className="analysis__summary">
            <SummaryScore label="Draft balance" value={analysis.overall} note={`${analysis.tier} · ${TIER_LABEL[analysis.tier]}`} color={tierColor} />
            <SummaryScore label="Archetype fit" value={analysis.synergy} note={analysis.synergyLabel} color={analysis.synergy >= 70 ? '#35d0c5' : analysis.synergy >= 45 ? '#d4b26c' : '#8fa0ad'} />
          </div>
        </div>
      </div>

      <div className="analysis__body">
        <div className="analysis__metrics">
          <RadarChart ratings={analysis.ratings} />
          <div className="analysis__bars">
            {BARS.map(({ key, label }) => (
              <RatingBar key={key} metric={key} label={label} value={analysis.ratings[key]} />
            ))}
          </div>
        </div>

        <div className="analysis__insights">
          {analysis.strengths.length > 0 && (
            <InsightGroup label="Strengths" items={analysis.strengths} variant="strength" />
          )}
          {analysis.weaknesses.length > 0 && (
            <InsightGroup label="Weaknesses" items={analysis.weaknesses} variant="weakness" />
          )}
          {analysis.suggestions.length > 0 && (
            <InsightGroup label="Suggestions" items={analysis.suggestions} variant="suggestion" />
          )}
          {analysis.meta.connected && analysis.meta.avgWinRate != null && (
            <div className="analysis__meta-note">
              Live avg win rate: <strong style={{ color: analysis.meta.avgWinRate >= 50 ? 'var(--cyan)' : 'var(--red)' }}>{analysis.meta.avgWinRate}%</strong>
              <span className="analysis__meta-src"> · {analysis.meta.source}</span>
            </div>
          )}
          {!analysis.meta.connected && (
            <p className="analysis__basis">{analysis.basis}</p>
          )}
        </div>
      </div>

      <div className="analysis__detail-grid">
        <section className="analysis__composition" aria-labelledby="composition-stats-title">
          <div className="analysis__section-title">
            <h3 id="composition-stats-title">Composition profile</h3>
            <span>Threat and formation balance</span>
          </div>
          <div className="composition-charts">
            <ProfileDonut
              label="Damage profile"
              values={[
                { label: 'Magic', value: analysis.draftStats.ap, color: '#9b7de5' },
                { label: 'Physical', value: analysis.draftStats.ad, color: '#d89b52' },
                { label: 'Hybrid', value: analysis.draftStats.mixed, color: '#0ac8b9' },
              ]}
            />
            <ProfileDonut
              label="Attack range"
              values={[
                { label: 'Ranged', value: analysis.draftStats.ranged, color: '#6db8e8' },
                { label: 'Melee', value: analysis.draftStats.melee, color: '#c8aa6e' },
              ]}
            />
          </div>
          <div className="composition-stats">
            <Stat label="Magic profiles" value={analysis.draftStats.ap} />
            <Stat label="Physical profiles" value={analysis.draftStats.ad} />
            <Stat label="Hybrid profiles" value={analysis.draftStats.mixed} />
            <Stat label="Frontline" value={analysis.draftStats.frontline} />
            <Stat label="Ranged" value={analysis.draftStats.ranged} />
            <Stat label="Melee" value={analysis.draftStats.melee} />
          </div>
        </section>

        <section className="analysis__counters" aria-labelledby="counter-signals-title">
          <div className="analysis__section-title">
            <h3 id="counter-signals-title">Estimated resilience</h3>
              <span>Heuristic draft signals</span>
          </div>
          <div className="counter-list">
            {analysis.counterSignals.map(signal => (
              <div className="counter-signal" key={signal.opponent}>
                <div><strong>Vs {signal.opponent}</strong><span>{signal.label}</span></div>
                <div className="counter-signal__score"><i><b style={{ width: `${signal.score}%` }} /></i><em>{signal.score}</em></div>
                <p>{signal.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="analysis__counter-picks" aria-labelledby="counter-picks-title">
          <div className="analysis__section-title">
            <h3 id="counter-picks-title">General draft responses</h3>
            <span>Ideas only — not live matchup or win-rate data</span>
          </div>
          <div className="counter-picks">
            {analysis.counterRecommendations.map(recommendation => (
              <article className="counter-pick" key={recommendation.comp}>
                <strong>{recommendation.comp}</strong>
                <p><b>Suggested champions:</b> {recommendation.champions.join(' · ')}</p>
                <p><b>Pressures:</b> {recommendation.targets.join(' · ')}</p>
                <p>{recommendation.why}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="composition-stat"><strong>{value}</strong><span>{label}</span></div>
}

function RadarChart({ ratings }: { ratings: Ratings }) {
  const center = 100
  const radius = 64
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / RADAR_AXES.length)
    const distance = radius * value / 100
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance]
  }
  const polygon = (value: number) => RADAR_AXES.map((_, index) => point(index, value).join(',')).join(' ')
  const dataPoints = RADAR_AXES.map(({ key }, index) => point(index, ratings[key]).join(',')).join(' ')

  return (
    <figure className="radar" aria-label="Team capability radar chart">
      <figcaption><strong>Team shape</strong><span>Six core draft dimensions</span></figcaption>
      <svg viewBox="0 0 200 200" role="img" aria-label={RADAR_AXES.map(axis => `${axis.label} ${ratings[axis.key]}`).join(', ')}>
        {[25, 50, 75, 100].map(level => <polygon key={level} points={polygon(level)} className="radar__grid" />)}
        {RADAR_AXES.map((axis, index) => {
          const [x, y] = point(index, 100)
          const [labelX, labelY] = point(index, 123)
          return <g key={axis.key}><line x1={center} y1={center} x2={x} y2={y} className="radar__axis" /><text x={labelX} y={labelY} className="radar__label">{axis.label}</text></g>
        })}
        <motion.polygon points={dataPoints} className="radar__data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .65, ease: 'easeOut' }} />
        {RADAR_AXES.map(({ key }, index) => { const [x, y] = point(index, ratings[key]); return <circle key={key} cx={x} cy={y} r="2.4" className="radar__point" /> })}
      </svg>
    </figure>
  )
}

function ProfileDonut({ label, values }: { label: string; values: { label: string; value: number; color: string }[] }) {
  const total = values.reduce((sum, item) => sum + item.value, 0) || 1
  let cursor = 0
  const stops = values.map(item => {
    const start = cursor
    cursor += item.value / total * 100
    return `${item.color} ${start}% ${cursor}%`
  }).join(', ')
  return (
    <div className="profile-donut">
      <div className="profile-donut__chart" style={{ background: `conic-gradient(${stops})` }} aria-hidden="true"><span>{values.reduce((sum, item) => sum + item.value, 0)}</span></div>
      <div className="profile-donut__copy">
        <strong>{label}</strong>
        <div className="profile-donut__legend">{values.map(item => <span key={item.label}><i style={{ background: item.color }} />{item.label} <b>{item.value}</b></span>)}</div>
      </div>
    </div>
  )
}

function SummaryScore({ label, value, note, color }: { label: string; value: number; note: string; color: string }) {
  return (
    <motion.div className="summary-score" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
      <div className="summary-score__top"><span>{label}</span><strong style={{ color }}>{value}<small>/100</small></strong></div>
      <div className="summary-score__track"><motion.i style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: .65, ease: 'easeOut' }} /></div>
      <span className="summary-score__note">{note}</span>
    </motion.div>
  )
}

function RatingBar({ metric, label, value }: { metric: keyof Ratings; label: string; value: number }) {
  const barColor = value >= 70 ? 'var(--cyan)' : value >= 45 ? 'var(--gold)' : 'var(--text-dim)'
  return (
    <div className="rbar">
      <span className="rbar__icon"><MetricIcon metric={metric} /></span>
      <span className="rbar__label">{label}</span>
      <span className="rbar__val">{value}</span>
      <div className="rbar__track">
        <motion.div className="rbar__fill" style={{ background: barColor }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: .55, ease: 'easeOut', delay: .1 }} />
      </div>
    </div>
  )
}

function InsightGroup({ label, items, variant }: { label: string; items: string[]; variant: 'strength'|'weakness'|'suggestion' }) {
  return (
    <div className={`insight-group insight-group--${variant}`}>
      <span className="insight-group__label"><StatusIcon variant={variant} /> {label}</span>
      {items.map((item, i) => <div key={i} className="insight-item">{item}</div>)}
    </div>
  )
}

function ArchetypeIcon({ archetype }: { archetype: TeamAnalysis['archetype'] }) {
  const metric: keyof Ratings = archetype === 'poke' ? 'poke' : archetype === 'dive' ? 'engage' : archetype === 'scaling' ? 'lateGame' : archetype === 'siege' ? 'objectiveControl' : 'cc'
  return <MetricIcon metric={metric} />
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
}

function StatusIcon({ variant }: { variant: 'strength'|'weakness'|'suggestion' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{variant === 'strength' ? <path d="m5 12 4 4L19 6" /> : variant === 'weakness' ? <><circle cx="12" cy="12" r="8" /><path d="M12 8v5M12 16h.01" /></> : <><path d="M5 12h13M13 7l5 5-5 5" /></>}</svg>
}

function MetricIcon({ metric }: { metric: keyof Ratings }) {
  const paths: Record<keyof Ratings, ReactNode> = {
    damage: <><path d="m5 19 14-14M8 5l-3 3 3 3M16 13l3 3-3 3" /><path d="m14 5 5 5" /></>,
    tank: <path d="M12 3 5 6v5c0 4.4 2.7 7.8 7 10 4.3-2.2 7-5.6 7-10V6l-7-3Z" />,
    cc: <><path d="M9.5 14.5 7 17a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0" /><path d="m14.5 9.5 2.5-2.5a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0M8 12h8" /></>,
    engage: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
    earlyGame: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    lateGame: <><path d="M4 18 10 12l4 4 6-9" /><path d="M15 7h5v5" /></>,
    poke: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    disengage: <><path d="M4 8h11a3 3 0 1 0-3-3M4 12h15M4 16h8a3 3 0 1 1-3 3" /></>,
    objectiveControl: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[metric]}</svg>
}
