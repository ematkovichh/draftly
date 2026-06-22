import { motion } from 'framer-motion'
import type { TeamAnalysis as Analysis } from '../core/types'
import { TierBadge } from './TierBadge'
import './TeamAnalysis.css'

const ROWS: { key: keyof Analysis['ratings']; label: string }[] = [
  { key: 'damage', label: 'Damage' },
  { key: 'cc', label: 'Crowd Control' },
  { key: 'tank', label: 'Tankiness' },
  { key: 'engage', label: 'Engage' },
  { key: 'lateGame', label: 'Late Game' },
]

function barColor(v: number): string {
  if (v >= 78) return 'var(--cyan)'
  if (v >= 58) return 'var(--gold)'
  if (v >= 40) return 'var(--tier-d)'
  return 'var(--tier-f)'
}

export function TeamAnalysis({ analysis }: { analysis: Analysis }) {
  return (
    <section className="analysis">
      <div className="analysis__head">
        <span className="eyebrow">Team Analysis</span>
        <div className="hex-rule analysis__rule" />
      </div>

      <div className="analysis__grid">
        <div className="analysis__bars">
          {ROWS.map((row, i) => {
            const value = analysis.ratings[row.key]
            return (
              <div className="bar" key={row.key}>
                <div className="bar__label">
                  <span>{row.label}</span>
                  <span className="bar__value">{value}</span>
                </div>
                <div className="bar__track">
                  <motion.div
                    className="bar__fill"
                    style={{ background: barColor(value) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.08 * i,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="analysis__verdict">
          <TierBadge tier={analysis.tier} score={analysis.overall} />
          <ul className="analysis__notes">
            {analysis.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>

          <div className="analysis__meta">
            {analysis.meta.connected ? (
              <div className="metastat-row">
                {analysis.meta.avgWinRate != null && (
                  <span className="metastat">
                    <small>Avg Win</small>
                    {analysis.meta.avgWinRate}%
                  </span>
                )}
                {analysis.meta.avgPickRate != null && (
                  <span className="metastat">
                    <small>Avg Pick</small>
                    {analysis.meta.avgPickRate}%
                  </span>
                )}
                {analysis.meta.avgBanRate != null && (
                  <span className="metastat">
                    <small>Avg Ban</small>
                    {analysis.meta.avgBanRate}%
                  </span>
                )}
              </div>
            ) : (
              <p className="analysis__metanote">
                Win / pick / ban not connected — connect a meta provider to
                fold live rates into the score.
              </p>
            )}
            <p className="analysis__basis">{analysis.basis}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
