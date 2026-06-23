import type { MetaStatsProvider, MetaStatsResult } from '../types'
export class NullMetaProvider implements MetaStatsProvider {
  readonly id = 'none'; readonly label = 'Not connected'
  isAvailable() { return false }
  async fetchMeta(): Promise<MetaStatsResult> { return { source: this.label, patch: '—', byChampion: {} } }
}
