import { motion } from 'framer-motion'
import type { Tier } from '../core/types'
import './TierBadge.css'

const TIER_NAME: Record<Tier, string> = {
  S: 'Godlike',
  A: 'Dominant',
  B: 'Solid',
  C: 'Workable',
  D: 'Risky',
  F: 'Troll Comp',
}

export function TierBadge({ tier, score }: { tier: Tier; score: number }) {
  return (
    <div className="tier">
      <motion.div
        className={`tier__medal tier--${tier}`}
        key={tier}
        initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      >
        <span className="tier__letter">{tier}</span>
      </motion.div>
      <div className="tier__meta">
        <span className="eyebrow">Composition Rating</span>
        <div className="tier__name">{TIER_NAME[tier]}</div>
        <div className="tier__score">
          <motion.span
            key={score}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {score}
          </motion.span>
          <small>/100</small>
        </div>
      </div>
    </div>
  )
}
