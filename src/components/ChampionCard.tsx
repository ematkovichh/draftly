import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Champion, Role } from '../core/types'
import { ROLE_LABEL } from '../core/draft'
import { championDataProvider } from '../data/providers/registry'
import { RoleIcon } from './RoleIcon'
import './ChampionCard.css'

interface Props {
  champion: Champion
  role: Role
  index: number
  onReroll: () => void
  isNew?: boolean
}

export function ChampionCard({ champion, role, index, onReroll, isNew }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const splashSrc = imgError
    ? championDataProvider.squareUrl(champion.id)
    : championDataProvider.splashUrl(champion.id)

  return (
    <motion.div
      className="card"
      layout
      initial={isNew ? { opacity: 0, y: 28, scale: 0.93 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Art */}
      <div className="card__art">
        {!imgLoaded && <div className="card__shimmer" />}
        <img
          src={splashSrc}
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
        <span className={`card__dmg-badge card__dmg-badge--${champion.damageType}`}>{champion.damageType}</span>
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
          {champion.yordle && <span className="card__arch card__arch--yordle">yordle</span>}
        </div>
      </div>

      {/* Reroll */}
      <button className="card__reroll" onClick={onReroll} title="Reroll this slot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        Reroll
      </button>
    </motion.div>
  )
}
