// ── Provider contracts ───────────────────────────────────────────────
// New data sources are added by implementing one of these interfaces and
// registering it (see registry.ts). The rest of the app depends only on
// these contracts, never on a concrete API — so adding OP.GG, U.GG, a
// Riot-aggregation backend, etc. requires no changes elsewhere.

import type { BaseStats, ChampClass, MetaStats, RiotInfo, Role } from '../../core/types'

/** Raw champion record a ChampionDataProvider yields (Data-Dragon-shaped). */
export interface RawChampion {
  id: string
  key: number
  name: string
  title: string
  tags: ChampClass[]
  partype: string
  info: RiotInfo
  stats: BaseStats
  /** passive + spell text used for CC / engage parsing */
  abilities: { name?: string; description?: string; tooltip?: string }[]
}

export interface ChampionDataResult {
  patch: string
  source: string
  champions: RawChampion[]
}

/** Supplies champion identity, stats, abilities, art. (Data Dragon.) */
export interface ChampionDataProvider {
  readonly id: string
  readonly label: string
  fetchChampions(): Promise<ChampionDataResult>
  splashUrl(championId: string): string
  loadingUrl(championId: string): string
  squareUrl(championId: string): string
}

export interface MetaStatsResult {
  source: string
  patch: string
  /** keyed by champion id, optionally by role */
  byChampion: Record<string, MetaStats>
  byRole?: Partial<Record<Role, Record<string, MetaStats>>>
  /** champion ids the source reports as actually played in each role */
  rolesByChampion?: Record<string, Role[]>
}

/**
 * Supplies win/pick/ban rate, counters, synergies, and (optionally) live
 * role data. Implementations must return real data or signal unavailability
 * via `isAvailable()` — they must never fabricate numbers.
 */
export interface MetaStatsProvider {
  readonly id: string
  readonly label: string
  /** Whether this provider is configured and reachable. */
  isAvailable(): Promise<boolean> | boolean
  fetchMeta(): Promise<MetaStatsResult>
}
