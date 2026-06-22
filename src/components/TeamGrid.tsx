import type { Role, Team } from '../core/types'
import { ROLES } from '../core/draft'
import { ChampionCard } from './ChampionCard'
import './TeamGrid.css'

interface Props {
  team: Team
  onReroll: (role: Role) => void
}

export function TeamGrid({ team, onReroll }: Props) {
  return (
    <div className="team-grid">
      {ROLES.map((role, i) => (
        <ChampionCard
          key={role}
          role={role}
          champion={team[role]}
          onReroll={onReroll}
          index={i}
        />
      ))}
    </div>
  )
}
