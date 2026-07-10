import { describe, expect, it } from 'vitest'
import { DraftEngine, ROLES } from './draft'
import type { Champion, Role } from './types'

function champion(id: string, roles: Role[], damageType: Champion['damageType'] = 'AP'): Champion {
  return {
    id,
    key: id.length,
    name: id,
    title: 'Test champion',
    classes: ['Mage'],
    partype: 'Mana',
    roles,
    damageType,
    rangeType: 'ranged',
    archetypes: ['poke'],
    yordle: false,
    offMetaRef: false,
    info: { attack: 1, defense: 1, magic: 8, difficulty: 1 },
    base: { hp: 500, hpperlevel: 100, armor: 20, armorperlevel: 4, spellblock: 30, spellblockperlevel: 2, attackdamage: 50, attackdamageperlevel: 2, attackspeed: .65, attackspeedperlevel: 2, attackrange: 550, movespeed: 330, hpregen: 5, mp: 400 },
    rawMetrics: { damage: 1, cc: 1, tank: 1, engage: 1, scaling: 1, earlyGame: 1, poke: 1, disengage: 1, objectiveControl: 1 },
    ratings: { damage: 50, cc: 50, tank: 50, engage: 50, lateGame: 50, earlyGame: 50, poke: 50, disengage: 50, objectiveControl: 50 },
    meta: null,
  }
}

describe('DraftEngine', () => {
  const roster = [
    champion('Flex', ['top', 'jungle', 'mid', 'adc', 'support']),
    ...ROLES.map(role => champion(`AP-${role}`, [role])),
    ...ROLES.map(role => champion(`AD-${role}`, [role], 'AD')),
  ]

  it('generates a five-role team without duplicate champions', () => {
    const team = new DraftEngine(roster).generate('random', 'none')
    const picks = ROLES.map(role => team[role])
    const ids = picks.map(champion => champion?.id)

    expect(picks).not.toContain(null)
    expect(new Set(ids)).toHaveLength(ROLES.length)
  })

  it('keeps challenge filtering role-aware', () => {
    const pool = new DraftEngine(roster).pool('top', 'random', 'fullAD')

    expect(pool).toHaveLength(1)
    expect(pool[0].id).toBe('AD-top')
  })

  it('keeps every available role aligned to the requested archetype', () => {
    const team = new DraftEngine(roster).generate('poke', 'none')

    expect(ROLES.every(role => team[role]?.archetypes.includes('poke'))).toBe(true)
  })

  it('does not reroll into a teammate that is unavailable', () => {
    const engine = new DraftEngine(roster)

    expect(engine.roll('top', 'random', 'none', undefined, ['Flex', 'AP-top'])).toMatchObject({ id: 'AD-top' })
  })

  it('rerolls from the full eligible role pool, not only the team archetype', () => {
    const topPoke = champion('Poke-top', ['top'])
    const topDive = { ...champion('Dive-top', ['top']), archetypes: ['dive' as const] }
    const engine = new DraftEngine([topPoke, topDive])

    expect(engine.reroll('top', 'none', topPoke, [], [topPoke.id])).toMatchObject({ id: 'Dive-top' })
  })

  it('does not repeat a seen champion while a fresh role option exists', () => {
    const first = champion('First-top', ['top'])
    const seen = champion('Seen-top', ['top'])
    const fresh = champion('Fresh-top', ['top'])
    const engine = new DraftEngine([first, seen, fresh])

    expect(engine.reroll('top', 'none', first, [], [first.id, seen.id])).toMatchObject({ id: 'Fresh-top' })
  })
})
