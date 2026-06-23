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
  { key:'lateGame',        label:'Late Game',        icon:'📈' },
  { key:'poke',            label:'Poke',             icon:'🎯' },
  { key:'disengage',       label:'Disengage',        icon:'💨' },
  { key:'objectiveControl',label:'Objectives',       icon:'🏆' },
]

export function TeamAnalysis({ analysis }: { analysis: TeamAnalysis }) {
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
          <SynergyRing synergy={analysis.synergy} label={analysis.synergyLabel} />
          <GradeBadge tier={analysis.tier} score={analysis.overall} color={tierColor} />
        </div>
      </div>

      <div className="hex-rule" />

      {/* Two-column: bars + insights */}
      <div className="analysis__body">
        <div className="analysis__bars">
          {BARS.map(({ key, label, icon }) => (
            <RatingBar key={key} label={label} icon={icon} value={analysis.ratings[key]} />
          ))}
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
