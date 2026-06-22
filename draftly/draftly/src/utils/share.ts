import type { Archetype, Challenge, Champion, Team } from '../core/types'
import { ROLES, ROLE_LABEL } from '../core/draft'

interface EncodedState {
  team: Team
  archetype: Archetype
  challenge: Challenge
}

export function encodeToUrl(
  team: Team,
  archetype: Archetype,
  challenge: Challenge,
): string {
  const ids = ROLES.map((r) => team[r]?.id ?? '')
  const params = new URLSearchParams({
    t: ids.join('-'),
    a: archetype,
    c: challenge,
  })
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${params.toString()}`
}

/** Decode a shared draft from the URL hash against the loaded roster. */
export function decodeFromUrl(byId: Map<string, Champion>): EncodedState | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null
  const params = new URLSearchParams(hash)
  const ids = (params.get('t') ?? '').split('-')
  if (ids.length !== ROLES.length) return null

  const team = {} as Team
  let any = false
  ROLES.forEach((role, i) => {
    const champ = byId.get(ids[i])
    if (champ && champ.roles.includes(role)) {
      team[role] = champ
      any = true
    } else {
      team[role] = null
    }
  })
  if (!any) return null

  return {
    team,
    archetype: (params.get('a') ?? 'random') as Archetype,
    challenge: (params.get('c') ?? 'none') as Challenge,
  }
}

export function syncUrl(team: Team, archetype: Archetype, challenge: Challenge) {
  window.history.replaceState(null, '', encodeToUrl(team, archetype, challenge))
}

export function teamToText(team: Team): string {
  const lines = ROLES.map(
    (r) => `${ROLE_LABEL[r].padEnd(8)} ${team[r]?.name ?? '—'}`,
  )
  return ['Draftly — Team Composition', '------------------------', ...lines].join(
    '\n',
  )
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
