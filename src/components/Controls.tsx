import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Archetype, Challenge, Team } from '../core/types'
import { ARCHETYPE_META, CHALLENGE_META, encodeTeam } from '../core/draft'
import './Controls.css'

const ARCHETYPES: Archetype[] = ['random', 'teamfight', 'poke', 'dive', 'scaling', 'siege']
const CHALLENGES: Challenge[] = ['none', 'fullAP', 'fullAD', 'yordle', 'oldSchool', 'offMeta']

interface Props {
  archetype: Archetype
  challenge: Challenge
  team: Team
  onGenerate: () => void
  onArchetype: (a: Archetype) => void
  onChallenge: (c: Challenge) => void
}

export function Controls({ archetype, challenge, team, onGenerate, onArchetype, onChallenge }: Props) {
  const [copied, setCopied] = useState(false)

  function share() {
    const url = encodeTeam(team, archetype, challenge)
    navigator.clipboard.writeText(url).catch(() => {})
    window.history.replaceState(null, '', url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const hasFilled = Object.values(team).some(c => c !== null)

  return (
    <div className="controls">
      {/* Archetype selector */}
      <div className="controls__row">
        <span className="eyebrow controls__section-label">Team Archetype</span>
        <div className="seg-tabs">
          {ARCHETYPES.map(a => {
            const meta = a === 'random' ? null : ARCHETYPE_META[a]
            const active = archetype === a
            return (
              <button key={a} className={`seg-tab${active ? ' seg-tab--active' : ''}`}
                onClick={() => onArchetype(a)}
                style={active && meta ? { borderColor: meta.color, color: meta.color } : undefined}>
                {meta && <span className="seg-tab__icon">{meta.icon}</span>}
                {a === 'random' ? 'Random' : a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Challenge selector */}
      <div className="controls__row">
        <span className="eyebrow controls__section-label">Challenge Mode</span>
        <div className="seg-tabs">
          {CHALLENGES.map(c => {
            const { label, icon } = CHALLENGE_META[c]
            const active = challenge === c
            return (
              <button key={c} className={`seg-tab seg-tab--sm${active ? ' seg-tab--active' : ''}`}
                onClick={() => onChallenge(c)}>
                <span className="seg-tab__icon">{icon}</span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Action row */}
      <div className="controls__actions">
        <motion.button className="forge-btn" onClick={onGenerate}
          whileTap={{ scale: .97 }} whileHover={{ scale: 1.015 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
            <path d="M12 2l8 4.5v9L12 22l-8-6.5v-9L12 2z" />
            <path d="M12 8l4 2.2v4.4L12 17l-4-2.4V10.2L12 8z" />
          </svg>
          Forge New Team
        </motion.button>
        {hasFilled && (
          <button className="ghost-btn" onClick={share}>
            {copied ? '✓ Link copied!' : '⎘ Share'}
          </button>
        )}
      </div>
    </div>
  )
}
