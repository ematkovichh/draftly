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

// Champions whose common damage profile cannot be described reliably by a
// simple count of ability descriptions (hybrid builds, empowered attacks, or
// unusual conversions). Keep these explicit and reviewable.
const DAMAGE_PROFILE_OVERRIDES: Record<string, DamageType> = {
  Akali: 'AP', Azir: 'AP', Diana: 'AP', Fizz: 'AP', Gwen: 'AP', Kennen: 'AP', Mordekaiser: 'AP', Teemo: 'AP',
  Corki: 'Mixed', DrMundo: 'Mixed', Ezreal: 'Mixed', Jax: 'Mixed', Kaisa: 'Mixed', Kayle: 'Mixed',
  KogMaw: 'Mixed', Nasus: 'Mixed', Ornn: 'Mixed', Sejuani: 'Mixed', Shen: 'Mixed', Shyvana: 'Mixed',
  TwistedFate: 'Mixed', Udyr: 'Mixed', Varus: 'Mixed', Volibear: 'Mixed', Warwick: 'Mixed',
  Locke: 'AD', Zaahen: 'AD',
}

/**
 * Estimates a champion's normal damage profile from Riot's ability text and
 * class tags. Riot's `info.attack` / `info.magic` fields are difficulty-style
 * ratings, not damage-type data, and must never be used for this label.
 */
export function damageTypeFrom(id: string, classes: ChampClass[], abilities: AbilityText[]): DamageType {
  const override = DAMAGE_PROFILE_OVERRIDES[id]
  if (override) return override

  let physical = classes.includes('Marksman') ? 2.5 : 0
  if (classes.includes('Fighter')) physical += 1.25
  if (classes.includes('Assassin')) physical += .5

  let magic = 0
  for (const ability of abilities) {
    const text = `${ability.description ?? ''} ${ability.tooltip ?? ''}`.toLocaleLowerCase()
    if (text.includes('physical damage')) physical += 1
    if (text.includes('magic damage')) magic += 1
  }

  if (physical >= magic * 1.5 && physical > 0) return 'AD'
  if (magic >= physical * 1.5 && magic > 0) return 'AP'
  return physical || magic ? 'Mixed' : classes.includes('Mage') ? 'AP' : 'AD'
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
  // Early strength is based on real level-one combat stats plus Riot's attack,
  // magic, and defence ratings. It intentionally favours lane pressure and
  // skirmish readiness rather than late-game growth.
  const earlyGame = Math.max(info.attack, info.magic) * 9 + base.hp * .045 + base.armor * .8 + base.attackdamage * base.attackspeed * .5 + parsed.cc * 1.5 + parsed.engage
  return { damage, tank, scaling, earlyGame, ...parsed }
}
