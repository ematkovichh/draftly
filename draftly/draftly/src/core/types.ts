// ── Core domain types ────────────────────────────────────────────────
// Everything here is provider-agnostic. Providers (Data Dragon, meta-stats
// sources) map their payloads into these shapes so the rest of the app
// never depends on a specific external API.

export type Role = 'top' | 'jungle' | 'mid' | 'adc' | 'support'

export type ChampClass =
  | 'Fighter'
  | 'Tank'
  | 'Mage'
  | 'Assassin'
  | 'Marksman'
  | 'Support'

export type DamageType = 'AP' | 'AD' | 'Mixed'

export type RangeType = 'melee' | 'ranged'

export type Archetype = 'dive' | 'poke' | 'teamfight' | 'scaling' | 'random'

export type Challenge =
  | 'none'
  | 'offMeta'
  | 'oldSchool'
  | 'fullAP'
  | 'fullAD'
  | 'yordle'

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

/** Raw base stats exactly as Data Dragon publishes them. */
export interface BaseStats {
  hp: number
  hpperlevel: number
  armor: number
  armorperlevel: number
  spellblock: number
  spellblockperlevel: number
  attackdamage: number
  attackdamageperlevel: number
  attackspeed: number
  attackspeedperlevel: number
  attackrange: number
  movespeed: number
  hpregen: number
  mp: number
}

/** Riot's own editorial 0–10 ratings (real Data Dragon data). */
export interface RiotInfo {
  attack: number
  defense: number
  magic: number
  difficulty: number
}

/**
 * Pre-normalisation metrics derived purely from real attributes.
 * Each becomes a 0–100 percentile rating once the whole roster is loaded.
 */
export interface RawMetrics {
  damage: number
  cc: number
  tank: number
  engage: number
  scaling: number
}

export interface Ratings {
  damage: number
  cc: number
  tank: number
  engage: number
  lateGame: number
}

/** Meta statistics from an external source. Optional and never fabricated. */
export interface MetaStats {
  source: string
  patch: string
  winRate?: number
  pickRate?: number
  banRate?: number
  /** Worst matchups for this champion in a role (by opponent champion id). */
  counters?: { championId: string; winRateAgainst: number }[]
  /** Best duo partners (mainly bot lane) by champion id. */
  synergies?: { championId: string; winRateWith: number }[]
}

/** A fully normalised champion the app works with. */
export interface Champion {
  id: string
  key: number
  name: string
  title: string
  classes: ChampClass[]
  partype: string
  roles: Role[]
  damageType: DamageType
  rangeType: RangeType
  yordle: boolean
  offMetaReference: boolean
  info: RiotInfo
  base: BaseStats
  rawMetrics: RawMetrics
  ratings: Ratings
  archetypes: Exclude<Archetype, 'random'>[]
  meta: MetaStats | null
}

export type Team = Record<Role, Champion | null>

export interface TeamAnalysis {
  ratings: Ratings
  overall: number
  tier: Tier
  notes: string[]
  /** Where the numbers came from, for transparency in the UI. */
  basis: string
  meta: {
    connected: boolean
    source?: string
    patch?: string
    avgWinRate?: number
    avgPickRate?: number
    avgBanRate?: number
  }
}

/** Metadata about the current dataset, surfaced in the UI. */
export interface DatasetInfo {
  patch: string
  championDataSource: string
  metaSource: string | null
  championCount: number
}
