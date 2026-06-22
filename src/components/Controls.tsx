import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Archetype, Challenge, Team } from '../core/types'
import { copyToClipboard, encodeToUrl, teamToText } from '../utils/share'
import './Controls.css'

const ARCHETYPES: { id: Archetype; label: string; hint: string }[] = [
  { id: 'random', label: 'Random', hint: 'Anything goes' },
  { id: 'dive', label: 'Dive', hint: 'Hard engage, all-in' },
  { id: 'poke', label: 'Poke', hint: 'Whittle from range' },
  { id: 'teamfight', label: 'Teamfight', hint: 'Win the 5v5' },
  { id: 'scaling', label: 'Scaling', hint: 'Win the long game' },
]

const CHALLENGES: { id: Challenge; label: string }[] = [
  { id: 'none', label: 'No Challenge' },
  { id: 'offMeta', label: 'Off Meta Only' },
  { id: 'oldSchool', label: 'Old School' },
  { id: 'fullAP', label: 'Full AP' },
  { id: 'fullAD', label: 'Full AD' },
  { id: 'yordle', label: 'Yordle Challenge' },
]

interface Props {
  archetype: Archetype
  challenge: Challenge
  team: Team
  onGenerate: () => void
  onArchetype: (a: Archetype) => void
  onChallenge: (c: Challenge) => void
}

export function Controls({
  archetype,
  challenge,
  team,
  onGenerate,
  onArchetype,
  onChallenge,
}: Props) {
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1900)
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(teamToText(team))
    flash(ok ? 'Composition copied' : 'Copy failed')
  }

  const handleShare = async () => {
    const url = encodeToUrl(team, archetype, challenge)
    const ok = await copyToClipboard(url)
    flash(ok ? 'Share link copied' : 'Copy failed')
  }

  return (
    <section className="controls">
      <div className="controls__group">
        <span className="eyebrow">Team Archetype</span>
        <div className="seg" role="tablist" aria-label="Team archetype">
          {ARCHETYPES.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={archetype === a.id}
              className={`seg__btn ${archetype === a.id ? 'is-active' : ''}`}
              onClick={() => onArchetype(a.id)}
              title={a.hint}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="controls__group">
        <span className="eyebrow">Challenge Mode</span>
        <div className="seg seg--wrap" role="tablist" aria-label="Challenge mode">
          {CHALLENGES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={challenge === c.id}
              className={`seg__btn ${challenge === c.id ? 'is-active' : ''}`}
              onClick={() => onChallenge(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="controls__actions">
        <motion.button
          className="forge"
          onClick={onGenerate}
          whileTap={{ scale: 0.97 }}
        >
          <span className="forge__inner">Generate New Team</span>
        </motion.button>

        <div className="controls__secondary">
          <button className="ghost-btn" onClick={handleShare}>
            Share Link
          </button>
          <button className="ghost-btn" onClick={handleCopy}>
            Copy Team
          </button>
        </div>
      </div>

      <div className="toast-wrap" aria-live="polite">
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </div>
    </section>
  )
}
