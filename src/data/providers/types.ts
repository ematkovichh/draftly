import type { BaseStats, ChampClass, MetaStats, RiotInfo, Role } from '../../core/types'

export interface RawChampion {
  id: string; key: number; name: string; title: string
  tags: ChampClass[]; partype: string; info: RiotInfo; stats: BaseStats
  abilities: { name?: string; description?: string; tooltip?: string }[]
}

export interface ChampionDataResult { patch: string; source: string; champions: RawChampion[] }

export interface ChampionDataProvider {
  readonly id: string; readonly label: string
  fetchChampions(): Promise<ChampionDataResult>
  splashUrl(id: string): string
  loadingUrl(id: string): string
  squareUrl(id: string): string
}

export interface MetaStatsResult {
  source: string; patch: string
  byChampion: Record<string, MetaStats>
  rolesByChampion?: Record<string, Role[]>
}

export interface MetaStatsProvider {
  readonly id: string; readonly label: string
  isAvailable(): Promise<boolean> | boolean
  fetchMeta(): Promise<MetaStatsResult>
}
