import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Champion, Role } from '../core/types'
import { ROLE_LABEL } from '../core/draft'
import { loadingUrl, splashUrl } from '../data/art'
import { RoleIcon } from './RoleIcon'
import './ChampionCard.css'

interface Props {
  role: Role
  champion: Champion | null
  onReroll: (role: Role) => void
  index: number
}

function RerollGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </svg>
  )
}

export function ChampionCard({ role, champion, onReroll, index }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  // Reset the loading state each time the champion in this slot changes.
  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [champion?.id])

  return (
    <motion.div
      className={`card ${loaded ? 'loaded' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="card__art">
        <AnimatePresence mode="wait">
          {champion && (
            <motion.img
              key={champion.id}
              src={failed ? loadingUrl(champion.id) : splashUrl(champion.id)}
              alt={`${champion.name} splash art`}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onLoad={() => setLoaded(true)}
              onError={() => {
                if (!failed) setFailed(true)
                else setLoaded(true)
              }}
            />
          )}
        </AnimatePresence>

        <div className="card__scrim" />

        <div className="card__role">
          <RoleIcon role={role} size={15} />
          <span>{ROLE_LABEL[role]}</span>
        </div>

        {champion && (
          <div className={`card__damage dmg-${champion.damageType}`}>
            {champion.damageType}
          </div>
        )}

        <div className="card__body">
          <AnimatePresence mode="wait">
            <motion.div
              key={champion?.id ?? 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card__name">{champion?.name ?? '—'}</div>
              {champion && (
                <div className="card__tags">
                  {champion.archetypes.slice(0, 2).map((a) => (
                    <span className="card__tag" key={a}>
                      {a}
                    </span>
                  ))}
                  {champion.yordle && <span className="card__tag">yordle</span>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button
        className="card__reroll"
        onClick={() => onReroll(role)}
        aria-label={`Reroll ${ROLE_LABEL[role]}`}
      >
        <RerollGlyph />
        Reroll
      </button>
    </motion.div>
  )
}
