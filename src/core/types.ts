export type Role = 'top' | 'jungle' | 'mid' | 'adc' | 'support'
export type ChampClass = 'Fighter' | 'Tank' | 'Mage' | 'Assassin' | 'Marksman' | 'Support'
export type DamageType = 'AP' | 'AD' | 'Mixed'
export type RangeType = 'melee' | 'ranged'
export type Archetype = 'teamfight' | 'poke' | 'dive' | 'scaling' | 'siege' | 'random'
export type Challenge = 'none' | 'fullAP' | 'fullAD' | 'yordle' | 'oldSchool' | 'offMeta'
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

export interface BaseStats {
  hp: number; hpperlevel: number; armor: number; armorperlevel: number
  spellblock: number; spellblockperlevel: number; attackdamage: number
  attackdamageperlevel: number; attackspeed: number; attackspeedperlevel: number
  attackrange: number; movespeed: number; hpregen: number; mp: number
}
export interface RiotInfo { attack: number; defense: number; magic: number; difficulty: number }
export interface RawMetrics { damage: number; cc: number; tank: number; engage: number; scaling: number; poke: number; disengage: number; objectiveControl: number }
export interface Ratings { damage: number; cc: number; tank: number; engage: number; lateGame: number; poke: number; disengage: number; objectiveControl: number }
export interface MetaStats { source: string; patch: string; winRate?: number; pickRate?: number; banRate?: number }

export interface Champion {
  id: string; key: number; name: string; title: string
  classes: ChampClass[]; partype: string; roles: Role[]
  damageType: DamageType; rangeType: RangeType
  archetypes: Exclude<Archetype, 'random'>[]
  yordle: boolean; offMetaRef: boolean
  info: RiotInfo; base: BaseStats; rawMetrics: RawMetrics; ratings: Ratings
  meta: MetaStats | null
}

export type Team = Record<Role, Champion | null>

export interface TeamAnalysis {
  ratings: Ratings; overall: number; tier: Tier
  archetype: Archetype; archetypeLabel: string; archetypeDesc: string
  synergy: number; synergyLabel: string
  strengths: string[]; weaknesses: string[]
  suggestions: string[]; notes: string[]
  basis: string
  meta: { connected: boolean; avgWinRate?: number; source?: string }
}
export interface DatasetInfo { patch: string; championDataSource: string; metaSource: string | null; championCount: number }
