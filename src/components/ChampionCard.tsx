import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Champion, Role } from '../core/types'
import { DAMAGE_LABEL, ROLE_LABEL } from '../core/draft'
import { championDataProvider } from '../data/providers/registry'
import { RoleIcon } from './RoleIcon'
import './ChampionCard.css'

interface Props {
  champion: Champion
  role: Role
  index: number
  onReroll?: () => void
  isNew?: boolean
  isReroll?: boolean
}

export function ChampionCard({ champion, role, index, onReroll, isNew, isReroll }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const portraitSrc = imgError
    ? championDataProvider.squareUrl(champion.id)
    : championDataProvider.loadingUrl(champion.id)

  return (
    <motion.div
      className={`card${isNew ? ' card--new' : ''}${isReroll ? ' card--reroll' : ''}`}
      initial={isNew ? isReroll ? { opacity: 0, scale: 0.82, filter: 'blur(3px)' } : { opacity: 0, y: 38, scale: 0.9, filter: 'blur(4px)' } : false}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      whileHover={{ y: -4, scale: 1.012 }}
      transition={isReroll ? { type: 'spring', stiffness: 520, damping: 25 } : { type: 'spring', stiffness: 260, damping: 22, delay: index * 0.08 }}
    >
      {/* Art */}
      <div className="card__art">
        {!imgLoaded && <div className="card__shimmer" />}
        <img
          src={portraitSrc}
          alt={champion.name}
          className={`card__img card__img--${champion.id}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true) }}
          style={{ opacity: imgLoaded ? 1 : 0 }}
        />
        <div className="card__vignette" />
        <div className={`card__dmg-glow card__dmg-glow--${champion.damageType}`} />
      </div>

      {/* Top badges */}
      <div className="card__top">
        <div className="card__role-badge">
          <RoleIcon role={role} />
          <span>{ROLE_LABEL[role]}</span>
        </div>
        <span className={`card__dmg-badge card__dmg-badge--${champion.damageType}`}>{DAMAGE_LABEL[champion.damageType]}</span>
      </div>

      {/* Bottom info */}
      <div className="card__bottom">
        <div className="card__identity">
          <h3 className="card__name">{champion.name}</h3>
          <p className="card__title">{champion.title}</p>
        </div>
        <div className="card__tags">
          {champion.archetypes.slice(0, 2).map(a => (
            <span key={a} className={`card__arch card__arch--${a}`}>{a}</span>
          ))}
          {champion.ratings.earlyGame >= 60 && <span className="card__arch card__arch--early">early</span>}
          {champion.yordle && <span className="card__arch card__arch--yordle">yordle</span>}
        </div>
      </div>

      {/* Reroll */}
      {onReroll && <button type="button" className="card__reroll" onClick={onReroll} aria-label={`Reroll ${ROLE_LABEL[role]}: ${champion.name}`} title="Reroll this slot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        Reroll
      </button>}
    </motion.div>
  )
}
