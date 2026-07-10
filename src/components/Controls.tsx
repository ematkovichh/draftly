import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Archetype, Challenge, Team } from '../core/types'
import { ARCHETYPE_META, CHALLENGE_META } from '../core/draft'
import { copyToClipboard, encodeToUrl } from '../utils/share'
import './Controls.css'

const ARCHETYPES: Archetype[] = ['random', 'teamfight', 'poke', 'dive', 'scaling', 'siege']
const CHALLENGES: Challenge[] = ['none', 'fullAP', 'fullAD', 'earlyGame', 'allMelee', 'allRanged', 'yordle', 'oldSchool', 'offMeta']

interface Props {
  archetype: Archetype
  challenge: Challenge
  team: Team
  isComplete: boolean
  isManualDraft: boolean
  hasStats: boolean
  isGeneratingStats: boolean
  onGenerate: () => void
  onStartDraft: () => void
  onGenerateStats: () => void
  onArchetype: (a: Archetype) => void
  onChallenge: (c: Challenge) => void
}

export function Controls({ archetype, challenge, team, isComplete, isManualDraft, hasStats, isGeneratingStats, onGenerate, onStartDraft, onGenerateStats, onArchetype, onChallenge }: Props) {
  const [copied, setCopied] = useState(false)
  const [challengesOpen, setChallengesOpen] = useState(false)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
  }, [])

  async function share() {
    const url = encodeToUrl(team, archetype, challenge)
    await copyToClipboard(url)
    window.history.replaceState(null, '', url)
    setCopied(true)
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000)
  }

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
                type="button" onClick={() => onArchetype(a)} aria-pressed={active}
                style={active && meta ? { borderColor: meta.color, color: meta.color } : undefined}>
                {meta && <span className="seg-tab__icon">{meta.icon}</span>}
                {a === 'random' ? 'Random' : a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            )
          })}
          {archetype !== 'random' && <button type="button" className="seg-tab seg-tab--clear" onClick={() => onArchetype('random')} aria-label="Clear selected team archetype">× Clear</button>}
        </div>
      </div>

      <div className="controls__row controls__challenge">
        <button type="button" className="challenge-toggle" aria-expanded={challengesOpen} aria-controls="challenge-options" onClick={() => setChallengesOpen(open => !open)}>
          <span><span className="eyebrow">Challenge Mode</span><small>{challenge === 'none' ? 'Optional composition rules' : CHALLENGE_META[challenge].label}</small></span>
          <span aria-hidden="true">{challengesOpen ? 'Hide' : 'Show'}</span>
        </button>
        {challengesOpen && (
          <div id="challenge-options" className="seg-tabs controls__challenge-options">
            {CHALLENGES.map(c => {
              const { label } = CHALLENGE_META[c]
              const active = challenge === c
              return <button key={c} className={`seg-tab seg-tab--sm${active ? ' seg-tab--active' : ''}`} type="button" onClick={() => onChallenge(c)} aria-pressed={active}>{label}</button>
            })}
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="controls__actions">
        <motion.button type="button" className="forge-btn" onClick={onGenerate}
          whileTap={{ scale: .97 }} whileHover={{ scale: 1.015 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
            <path d="M12 2l8 4.5v9L12 22l-8-6.5v-9L12 2z" />
            <path d="M12 8l4 2.2v4.4L12 17l-4-2.4V10.2L12 8z" />
          </svg>
          Forge New Team
        </motion.button>
        <button type="button" className="ghost-btn" onClick={onStartDraft}>
          {isManualDraft ? 'Restart manual draft' : 'Draft manually'}
        </button>
        {(isComplete || isManualDraft) && (
          <button type="button" className="stats-btn" onClick={onGenerateStats} disabled={isGeneratingStats} aria-busy={isGeneratingStats}>
            <span className={isGeneratingStats ? 'stats-btn__spinner' : 'stats-btn__icon'} aria-hidden="true">{isGeneratingStats ? '' : '◈'}</span>
            {isGeneratingStats ? 'Generating stats…' : hasStats ? 'Refresh draft stats' : isManualDraft ? 'Generate draft stats' : 'Generate team stats'}
          </button>
        )}
        {isComplete && (
          <button type="button" className="ghost-btn" onClick={share} aria-live="polite">
            {copied ? '✓ Link copied!' : '⎘ Share'}
          </button>
        )}
      </div>
    </div>
  )
}
