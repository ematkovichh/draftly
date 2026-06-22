import type { MetaStatsProvider, MetaStatsResult } from '../types'

/**
 * The default meta provider. It is intentionally empty: when no real
 * meta-stats source is configured, Draftly shows win/pick/ban/counters as
 * "not connected" rather than inventing numbers.
 */
export class NullMetaProvider implements MetaStatsProvider {
  readonly id = 'none'
  readonly label = 'Not connected'
  isAvailable() {
    return false
  }
  async fetchMeta(): Promise<MetaStatsResult> {
    return { source: this.label, patch: '—', byChampion: {} }
  }
}
