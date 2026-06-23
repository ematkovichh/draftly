import type { AbilityText } from './parse'
import { parseAbilities } from './parse'
import type { BaseStats, ChampClass, DamageType, RangeType, RawMetrics, RiotInfo } from '../types'

export function statAtLevel(base: number, perLevel: number, level: number): number {
  if (level <= 1) return base
  const n = level - 1
  return base + perLevel * n * (0.7025 + 0.0175 * n)
}

export function rangeTypeFrom(stats: BaseStats): RangeType {
  return stats.attackrange >= 350 ? 'ranged' : 'melee'
}

export function damageTypeFrom(info: RiotInfo): DamageType {
  if (info.magic - info.attack >= 2) return 'AP'
  if (info.attack - info.magic >= 2) return 'AD'
  return 'Mixed'
}

const EVAL = 13

export function deriveRawMetrics(
  info: RiotInfo, base: BaseStats, classes: ChampClass[], abilities: AbilityText[]
): RawMetrics {
  const ad = statAtLevel(base.attackdamage, base.attackdamageperlevel, EVAL)
  const asps = base.attackspeed * (1 + (base.attackspeedperlevel / 100) * (EVAL - 1))
  const hp = statAtLevel(base.hp, base.hpperlevel, EVAL)
  const armor = statAtLevel(base.armor, base.armorperlevel, EVAL)
  const mr = statAtLevel(base.spellblock, base.spellblockperlevel, EVAL)
  const effHp = hp * (1 + (armor + mr) / 2 / 100)

  const damage = Math.max(info.attack, info.magic) * 12 + ad * asps * 0.45
  const tank = effHp * 0.06 + info.defense * 6 + (classes.includes('Tank') ? 18 : 0)

  const power = (lvl: number) => statAtLevel(base.attackdamage, base.attackdamageperlevel, lvl) * 2 + statAtLevel(base.hp, base.hpperlevel, lvl) * 0.15
  const growthRatio = power(18) / power(3)
  const carryClass = classes.includes('Marksman') || classes.includes('Mage')
  const scaling = growthRatio * 22 + (carryClass ? 6 : 0) + info.magic * 0.6

  const parsed = parseAbilities(abilities)
  return { damage, tank, scaling, ...parsed }
}
