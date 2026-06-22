// ── Stat derivation ──────────────────────────────────────────────────
// Turns real Data Dragon base stats into combat metrics using Riot's
// actual per-level growth formula. No champion is special-cased.

import type { AbilityText } from './parse'
import { ccScoreFromAbilities, engageScoreFromAbilities } from './parse'
import type { BaseStats, DamageType, RangeType, RawMetrics, RiotInfo } from '../types'

/**
 * Riot's real stat-growth curve: the per-level value is scaled by
 *   (n - 1) * (0.7025 + 0.0175 * (n - 1))
 * so growth is slightly front-loaded, exactly as in-game.
 */
export function statAtLevel(base: number, perLevel: number, level: number): number {
  if (level <= 1) return base
  const n = level - 1
  return base + perLevel * n * (0.7025 + 0.0175 * n)
}

const RANGED_THRESHOLD = 350

export function rangeTypeFrom(stats: BaseStats): RangeType {
  return stats.attackrange >= RANGED_THRESHOLD ? 'ranged' : 'melee'
}

/** AP / AD / Mixed from Riot's own attack vs magic ratings. */
export function damageTypeFrom(info: RiotInfo): DamageType {
  if (info.magic - info.attack >= 2) return 'AP'
  if (info.attack - info.magic >= 2) return 'AD'
  return 'Mixed'
}

interface DeriveInput {
  info: RiotInfo
  base: BaseStats
  classes: string[]
  abilities: AbilityText[]
}

const EVAL_LEVEL = 13 // mid–late game evaluation point

/**
 * Compute raw (pre-normalisation) metrics from real attributes.
 * These are later percentile-ranked across the whole roster.
 */
export function deriveRawMetrics({
  info,
  base,
  classes,
  abilities,
}: DeriveInput): RawMetrics {
  const ad = statAtLevel(base.attackdamage, base.attackdamageperlevel, EVAL_LEVEL)
  const asps = base.attackspeed * (1 + (base.attackspeedperlevel / 100) * (EVAL_LEVEL - 1))
  const autoDps = ad * asps

  const hp = statAtLevel(base.hp, base.hpperlevel, EVAL_LEVEL)
  const armor = statAtLevel(base.armor, base.armorperlevel, EVAL_LEVEL)
  const mr = statAtLevel(base.spellblock, base.spellblockperlevel, EVAL_LEVEL)
  const effHp = hp * (1 + (armor + mr) / 2 / 100)

  // Damage: Riot's holistic 0–10 ratings (real) anchor the signal, with
  // computed auto-attack DPS layered in so marksmen aren't undercounted.
  const damage = Math.max(info.attack, info.magic) * 12 + autoDps * 0.45

  // Tankiness: effective HP + Riot's defense rating + Tank class.
  const tank = effHp * 0.06 + info.defense * 6 + (classes.includes('Tank') ? 18 : 0)

  // CC + engage: parsed directly from real ability text.
  const cc = ccScoreFromAbilities(abilities)
  const engage = engageScoreFromAbilities(abilities)

  // Scaling: ratio of late (18) to early (3) combat power, real growth math.
  const power = (lvl: number) => {
    const a = statAtLevel(base.attackdamage, base.attackdamageperlevel, lvl)
    const h = statAtLevel(base.hp, base.hpperlevel, lvl)
    return a * 2 + h * 0.15
  }
  const growthRatio = power(18) / power(3)
  const carryClass = classes.includes('Marksman') || classes.includes('Mage')
  const scaling = growthRatio * 22 + (carryClass ? 6 : 0) + info.magic * 0.6

  return { damage, cc, tank, engage, scaling }
}
