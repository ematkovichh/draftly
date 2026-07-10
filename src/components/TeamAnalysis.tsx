import { motion } from 'framer-motion'
import type { Ratings, TeamAnalysis, Tier } from '../core/types'
import { ARCHETYPE_META } from '../core/draft'
import './TeamAnalysis.css'

const TIER_COLOR: Record<Tier, string> = { S:'#ffd56b', A:'#0ac8b9', B:'#4e9be8', C:'#9aa4ad', D:'#c08552', F:'#c14b4b' }
const TIER_LABEL: Record<Tier, string> = { S:'Exceptional', A:'Strong', B:'Solid', C:'Workable', D:'Weak', F:'Poor' }

const BARS: { key: keyof Ratings; label: string; icon: string }[] = [
  { key:'damage',          label:'Damage',          icon:'⚔' },
  { key:'tank',            label:'Frontline',        icon:'🛡' },
  { key:'cc',              label:'Crowd Control',    icon:'⛓' },
  { key:'engage',          label:'Engage',           icon:'⚡' },
  { key:'earlyGame',       label:'Early Game',       icon:'☀' },
  { key:'lateGame',        label:'Late Game',        icon:'📈' },
  { key:'poke',            label:'Poke',             icon:'🎯' },
  { key:'disengage',       label:'Disengage',        icon:'💨' },
  { key:'objectiveControl',label:'Objectives',       icon:'🏆' },
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
      {/* Header row: archetype identity + grade */}
      <div className="analysis__hero">
        <div className="analysis__archetype" style={{ borderColor: archMeta.color, color: archMeta.color }}>
          <span className="analysis__arch-icon">{archMeta.icon}</span>
          <div>
            <div className="analysis__arch-label">{analysis.archetypeLabel}</div>
            <div className="analysis__arch-desc">{analysis.archetypeDesc}</div>
          </div>
        </div>

        <div className="analysis__grade-area">
          {onClose && <button type="button" className="analysis__close" onClick={onClose} aria-label="Close team statistics">Close stats ×</button>}
          <SynergyRing synergy={analysis.synergy} label={analysis.synergyLabel} />
          <GradeBadge tier={analysis.tier} score={analysis.overall} color={tierColor} />
        </div>
      </div>

      <div className="hex-rule" />

      {/* Two-column: bars + insights */}
      <div className="analysis__body">
        <div className="analysis__metrics">
          <RadarChart ratings={analysis.ratings} />
          <div className="analysis__bars">
            {BARS.map(({ key, label, icon }) => (
              <RatingBar key={key} label={label} icon={icon} value={analysis.ratings[key]} />
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
                { label: 'AP', value: analysis.draftStats.ap, color: '#9b7de5' },
                { label: 'AD', value: analysis.draftStats.ad, color: '#d89b52' },
                { label: 'Mixed', value: analysis.draftStats.mixed, color: '#0ac8b9' },
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
            <Stat label="AP threats" value={analysis.draftStats.ap} />
            <Stat label="AD threats" value={analysis.draftStats.ad} />
            <Stat label="Mixed" value={analysis.draftStats.mixed} />
            <Stat label="Frontline" value={analysis.draftStats.frontline} />
            <Stat label="Ranged" value={analysis.draftStats.ranged} />
            <Stat label="Melee" value={analysis.draftStats.melee} />
          </div>
        </section>

        <section className="analysis__counters" aria-labelledby="counter-signals-title">
          <div className="analysis__section-title">
            <h3 id="counter-signals-title">Counter-readiness</h3>
            <span>Derived composition signals</span>
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
            <h3 id="counter-picks-title">Likely counter ideas</h3>
            <span>Composition guidance, not live matchup rates</span>
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

function GradeBadge({ tier, score, color }: { tier: Tier; score: number; color: string }) {
  return (
    <motion.div className="grade" style={{ borderColor: color }}
      initial={{ scale: .6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay: .3 }}>
      <motion.span className="grade__letter" style={{ color }}
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: .4, duration: .35 }}>
        {tier}
      </motion.span>
      <motion.span className="grade__score"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .55 }}>
        {score}/100
      </motion.span>
      <span className="grade__label" style={{ color }}>{TIER_LABEL[tier]}</span>
    </motion.div>
  )
}

function SynergyRing({ synergy, label }: { synergy: number; label: string }) {
  const r = 26; const c = 2 * Math.PI * r
  const dash = (synergy / 100) * c
  const synergyColor = synergy >= 75 ? 'var(--cyan)' : synergy >= 50 ? 'var(--gold)' : 'var(--text-dim)'
  return (
    <div className="synergy">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
        <motion.circle cx="34" cy="34" r={r} fill="none" stroke={synergyColor} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={`${c}`}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: .8, delay: .35, ease: 'easeOut' }}
          style={{ transformOrigin: '34px 34px', rotate: '-90deg' }} />
        <text x="34" y="38" textAnchor="middle" fill={synergyColor} fontSize="13" fontWeight="700" fontFamily="var(--font-display)">{synergy}</text>
      </svg>
      <span className="synergy__label">Synergy</span>
      <span className="synergy__grade" style={{ color: synergyColor }}>{label}</span>
    </div>
  )
}

function RatingBar({ label, icon, value }: { label: string; icon: string; value: number }) {
  const barColor = value >= 70 ? 'var(--cyan)' : value >= 45 ? 'var(--gold)' : 'var(--text-dim)'
  return (
    <div className="rbar">
      <span className="rbar__icon">{icon}</span>
      <span className="rbar__label">{label}</span>
      <div className="rbar__track">
        <motion.div className="rbar__fill" style={{ background: barColor }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: .55, ease: 'easeOut', delay: .1 }} />
      </div>
      <span className="rbar__val">{value}</span>
    </div>
  )
}

function InsightGroup({ label, items, variant }: { label: string; items: string[]; variant: 'strength'|'weakness'|'suggestion' }) {
  const icons = { strength: '✓', weakness: '✗', suggestion: '→' }
  return (
    <div className={`insight-group insight-group--${variant}`}>
      <span className="insight-group__label">{icons[variant]} {label}</span>
      {items.map((item, i) => <div key={i} className="insight-item">{item}</div>)}
    </div>
  )
}
