import { AnimatePresence } from 'framer-motion'
import type { Role, Team } from '../core/types'
import { ROLES } from '../core/draft'
import { ChampionCard } from './ChampionCard'
import './TeamGrid.css'

interface Props {
  team: Team
  onReroll: (role: Role) => void
  isGenerating: boolean
  revealKey: number
}

export function TeamGrid({ team, onReroll, revealKey }: Props) {
  const filled = ROLES.filter(r => team[r] !== null)
  if (!filled.length) return null

  return (
    <div className="team-grid">
      <AnimatePresence mode="popLayout">
        {ROLES.map((role, i) => {
          const champ = team[role]
          if (!champ) return null
          return (
            <ChampionCard
              key={`${revealKey}-${role}-${champ.id}`}
              champion={champ}
              role={role}
              index={i}
              onReroll={() => onReroll(role)}
              isNew
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
