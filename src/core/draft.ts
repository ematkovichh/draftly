import type { Archetype, Challenge, Champion, Role, Team } from './types'

export const ROLES: Role[] = ['top', 'jungle', 'mid', 'adc', 'support']
export const ROLE_LABEL: Record<Role, string> = { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'Bot', support: 'Support' }

export const ARCHETYPE_META: Record<Exclude<Archetype,'random'>, { icon: string; color: string }> = {
  teamfight: { icon: '⚔', color: '#c8aa6e' },
  poke:      { icon: '🎯', color: '#0ac8b9' },
  dive:      { icon: '⚡', color: '#e87d3e' },
  scaling:   { icon: '📈', color: '#7eb4d0' },
  siege:     { icon: '🏰', color: '#a8d08d' },
}

export const CHALLENGE_META: Record<Challenge, { label: string; icon: string }> = {
  none:      { label: 'No Challenge', icon: '—' },
  fullAP:    { label: 'Full AP',      icon: '🔮' },
  fullAD:    { label: 'Full AD',      icon: '⚔' },
  yordle:    { label: 'Yordle Only',  icon: '🐾' },
  oldSchool: { label: 'Old School',   icon: '📜' },
  offMeta:   { label: 'Off Meta',     icon: '🎲' },
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

  roll(role: Role, arch: Archetype, ch: Challenge, avoid?: string): Champion {
    const p = this.pool(role, arch, ch)
    if (p.length === 1) return p[0]
    const f = avoid ? p.filter(c => c.id !== avoid) : p
    return pick(f.length ? f : p)
  }

  generate(arch: Archetype, ch: Challenge): Team {
    return ROLES.reduce((t, r) => ({ ...t, [r]: this.roll(r, arch, ch) }), {} as Team)
  }
}

export function encodeTeam(team: Team, arch: Archetype, ch: Challenge): string {
  const ids = ROLES.map(r => team[r]?.id ?? '').join('-')
  const p = new URLSearchParams({ t: ids, a: arch, c: ch })
  return `${location.origin}${location.pathname}#${p.toString()}`
}

export function decodeTeam(byId: Map<string, Champion>): { team: Team; arch: Archetype; ch: Challenge } | null {
  const hash = location.hash.replace(/^#/, '')
  if (!hash) return null
  const p = new URLSearchParams(hash)
  const ids = (p.get('t') ?? '').split('-')
  if (ids.length !== ROLES.length) return null
  const team = {} as Team
  let any = false
  ROLES.forEach((r, i) => {
    const c = byId.get(ids[i])
    if (c && c.roles.includes(r)) { team[r] = c; any = true } else { team[r] = null }
  })
  if (!any) return null
  return { team, arch: (p.get('a') ?? 'random') as Archetype, ch: (p.get('c') ?? 'none') as Challenge }
}
