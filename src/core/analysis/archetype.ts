import type { Archetype, ChampClass, Ratings, RangeType } from '../types'

/**
 * Derive archetype membership from a champion's real, normalised ratings
 * plus class/range — not from a hand-written tag list.
 */
export function deriveArchetypes(
  ratings: Ratings,
  classes: ChampClass[],
  rangeType: RangeType,
): Exclude<Archetype, 'random'>[] {
  const out: Exclude<Archetype, 'random'>[] = []
  const isAssassinFighter =
    classes.includes('Assassin') || classes.includes('Fighter')
  const isCaster = classes.includes('Mage') || classes.includes('Marksman')

  if (ratings.engage >= 58 && (isAssassinFighter || classes.includes('Tank')))
    out.push('dive')
  if (rangeType === 'ranged' && ratings.engage <= 48 && isCaster)
    out.push('poke')
  if (ratings.cc >= 58 || classes.includes('Tank') || classes.includes('Support'))
    out.push('teamfight')
  if (ratings.lateGame >= 60) out.push('scaling')

  return out
}
