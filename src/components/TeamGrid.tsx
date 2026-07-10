import type { Role, Team } from '../core/types'
import { ROLES } from '../core/draft'
import { ChampionCard } from './ChampionCard'
import './TeamGrid.css'

interface Props {
  team: Team
  onReroll: (role: Role) => void
  canReroll: boolean
  revealKeys: Record<Role, number>
}

export function TeamGrid({ team, onReroll, canReroll, revealKeys }: Props) {
  const filled = ROLES.filter(r => team[r] !== null)
  const baseRevealKey = Math.min(...ROLES.map(role => revealKeys[role]))
  if (!filled.length) return null

  return (
    <div className="team-grid">
      {ROLES.map((role, i) => {
        const champ = team[role]
        if (!champ) return null
        return (
          <ChampionCard
            key={`${role}-${champ.id}-${revealKeys[role]}`}
            champion={champ}
            role={role}
            index={i}
            onReroll={canReroll ? () => onReroll(role) : undefined}
            isNew
            isReroll={revealKeys[role] > baseRevealKey}
          />
        )
      })}
    </div>
  )
}
