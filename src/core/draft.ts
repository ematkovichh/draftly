import type { Archetype, Challenge, Champion, Role, Team } from './types'

export const ROLES: Role[] = ['top', 'jungle', 'mid', 'adc', 'support']
export const ROLE_LABEL: Record<Role, string> = { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'Bot', support: 'Support' }
export const BAN_LIMIT = 5

export const ARCHETYPE_META: Record<Exclude<Archetype,'random'>, { icon: string; color: string }> = {
  teamfight: { icon: '⚔', color: '#c8aa6e' },
  poke:      { icon: '🎯', color: '#0ac8b9' },
  dive:      { icon: '⚡', color: '#e87d3e' },
  scaling:   { icon: '📈', color: '#7eb4d0' },
  siege:     { icon: '🏰', color: '#a8d08d' },
}

export const CHALLENGE_META: Record<Challenge, { label: string }> = {
  none:      { label: 'No Challenge' },
  fullAP:    { label: 'Full AP' },
  fullAD:    { label: 'Full AD' },
  yordle:    { label: 'Yordle Only' },
  oldSchool: { label: 'Old School' },
  offMeta:   { label: 'Off Meta' },
  allMelee:  { label: 'All Melee' },
  allRanged: { label: 'All Ranged' },
  earlyGame: { label: 'Strong Early Game' },
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export class DraftEngine {
  private byRole: Record<Role, Champion[]>
  private oldSchoolKey: number
  private metaConnected: boolean

  constructor(champions: Champion[]) {
    this.byRole = ROLES.reduce((acc, r) => ({ ...acc, [r]: champions.filter(c => c.roles.includes(r)) }), {} as Record<Role, Champion[]>)
    const keys = champions.map(c => c.key).sort((a, b) => a - b)
    this.oldSchoolKey = keys[Math.floor(keys.length * 0.38)] ?? 0
    this.metaConnected = champions.some(c => c.meta?.pickRate != null)
  }

  private matchChallenge(c: Champion, ch: Challenge): boolean {
    switch (ch) {
      case 'fullAP':    return c.damageType === 'AP' || c.damageType === 'Mixed'
      case 'fullAD':    return c.damageType === 'AD' || c.damageType === 'Mixed'
      case 'yordle':    return c.yordle
      case 'oldSchool': return c.key <= this.oldSchoolKey
      case 'offMeta':   return this.metaConnected ? (c.meta?.pickRate ?? 100) < 1.5 : c.offMetaRef
      case 'allMelee':  return c.rangeType === 'melee'
      case 'allRanged': return c.rangeType === 'ranged'
      case 'earlyGame': return c.ratings.earlyGame >= 60
      default:          return true
    }
  }

  pool(role: Role, arch: Archetype, ch: Challenge): Champion[] {
    const base = this.byRole[role]
    const byChallenge = base.filter(c => this.matchChallenge(c, ch))
    const usable = byChallenge.length ? byChallenge : base
    if (arch === 'random') return usable
    const byArch = usable.filter(c => c.archetypes.includes(arch as Exclude<Archetype,'random'>))
    return byArch.length ? byArch : usable
  }

  roll(role: Role, arch: Archetype, ch: Challenge, avoid?: string, unavailableIds: Iterable<string> = []): Champion {
    const p = this.pool(role, arch, ch)
    if (p.length === 1) return p[0]
    const unavailable = new Set(unavailableIds)
    if (avoid) unavailable.add(avoid)
    const available = p.filter(c => !unavailable.has(c.id))
    // A role pool is normally much larger than the rest of a five-player team.
    // Retain a usable fallback if a future custom provider exposes a tiny pool.
    return pick(available.length ? available : p.filter(c => c.id !== avoid))
  }

  generate(arch: Archetype, ch: Challenge): Team {
    if (arch === 'random') return this.generateOnce(arch, ch)

    // Pick from several valid role-by-role drafts and retain the most coherent
    // version of the requested archetype. This preserves variety while avoiding
    // a comp where only one slot actually expresses the selected game plan.
    let best = this.generateOnce(arch, ch)
    let bestScore = this.archetypeScore(best, arch)
    for (let attempt = 0; attempt < 15; attempt++) {
      const candidate = this.generateOnce(arch, ch)
      const score = this.archetypeScore(candidate, arch)
      if (score > bestScore) { best = candidate; bestScore = score }
    }
    return best
  }

  private generateOnce(arch: Archetype, ch: Challenge): Team {
    const taken = new Set<string>()
    const team = {} as Team
    for (const role of ROLES) {
      const champion = this.roll(role, arch, ch, undefined, taken)
      team[role] = champion
      taken.add(champion.id)
    }
    return team
  }

  private archetypeScore(team: Team, arch: Exclude<Archetype, 'random'>): number {
    const champions = ROLES.map(role => team[role]).filter((champion): champion is Champion => champion !== null)
    const fit = champions.filter(champion => champion.archetypes.includes(arch)).length
    const ratings = champions.map(champion => champion.ratings)
    const average = (key: keyof Champion['ratings']) => ratings.reduce((sum, rating) => sum + rating[key], 0) / ratings.length
    const strength = {
      teamfight: average('cc') * .4 + average('tank') * .3 + average('engage') * .3,
      poke: average('poke') * .55 + average('disengage') * .25 + average('damage') * .2,
      dive: average('engage') * .5 + average('damage') * .35 + average('tank') * .15,
      scaling: average('lateGame') * .55 + average('damage') * .25 + average('disengage') * .2,
      siege: average('poke') * .4 + average('disengage') * .35 + average('objectiveControl') * .25,
    }[arch]
    return fit * 1000 + strength
  }
}
