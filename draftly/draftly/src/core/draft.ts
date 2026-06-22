// ── Draft engine ─────────────────────────────────────────────────────
// Builds teams from the loaded roster. Archetypes use derived (real) tags;
// challenges use real attributes: AP/AD from Riot info, "old school" from
// each champion's real Data Dragon release key, off-meta from live pick
// rate when connected (else the reference flag), yordle from lore data.

import type { Archetype, Challenge, Champion, Role, Team } from './types'

export const ROLES: Role[] = ['top', 'jungle', 'mid', 'adc', 'support']

export const ROLE_LABEL: Record<Role, string> = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  adc: 'Bot',
  support: 'Support',
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export class DraftEngine {
  private byRole: Record<Role, Champion[]>
  private oldSchoolKey: number
  private metaConnected: boolean

  constructor(champions: Champion[]) {
    this.byRole = ROLES.reduce(
      (acc, r) => ({ ...acc, [r]: champions.filter((c) => c.roles.includes(r)) }),
      {} as Record<Role, Champion[]>,
    )
    // "Old school" = oldest ~40% of the roster by real release key.
    const keys = [...champions.map((c) => c.key)].sort((a, b) => a - b)
    this.oldSchoolKey = keys[Math.floor(keys.length * 0.4)] ?? 0
    this.metaConnected = champions.some((c) => c.meta?.pickRate != null)
  }

  private matchesChallenge(c: Champion, challenge: Challenge): boolean {
    switch (challenge) {
      case 'offMeta':
        // Real pick rate when available; else the maintained reference flag.
        return this.metaConnected
          ? (c.meta?.pickRate ?? 100) < 1.5
          : c.offMetaReference
      case 'oldSchool':
        return c.key <= this.oldSchoolKey
      case 'fullAP':
        return c.damageType === 'AP' || c.damageType === 'Mixed'
      case 'fullAD':
        return c.damageType === 'AD' || c.damageType === 'Mixed'
      case 'yordle':
        return c.yordle
      default:
        return true
    }
  }

  /** Candidate pool for a role; constraints relax gracefully, never empty. */
  poolForRole(role: Role, archetype: Archetype, challenge: Challenge): Champion[] {
    const base = this.byRole[role]
    const byChallenge = base.filter((c) => this.matchesChallenge(c, challenge))
    const usable = byChallenge.length ? byChallenge : base
    if (archetype === 'random') return usable
    const byArch = usable.filter((c) => c.archetypes.includes(archetype))
    return byArch.length ? byArch : usable
  }

  rollRole(
    role: Role,
    archetype: Archetype,
    challenge: Challenge,
    avoidId?: string,
  ): Champion {
    const pool = this.poolForRole(role, archetype, challenge)
    if (pool.length === 1) return pool[0]
    const filtered = avoidId ? pool.filter((c) => c.id !== avoidId) : pool
    return pickRandom(filtered.length ? filtered : pool)
  }

  generateTeam(archetype: Archetype, challenge: Challenge): Team {
    const team = {} as Team
    for (const role of ROLES) team[role] = this.rollRole(role, archetype, challenge)
    return team
  }
}
