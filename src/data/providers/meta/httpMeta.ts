import type { MetaStats } from '../../../core/types'
import type { MetaStatsProvider, MetaStatsResult } from '../types'
interface Payload { source: string; patch: string; byChampion: Record<string, MetaStats>; rolesByChampion?: MetaStatsResult['rolesByChampion'] }
export class HttpMetaProvider implements MetaStatsProvider {
  readonly id = 'http'; readonly label = 'External stats API'
  constructor(private endpoint: string | undefined) {}
  isAvailable() { return Boolean(this.endpoint) }
  async fetchMeta(): Promise<MetaStatsResult> {
    if (!this.endpoint) throw new Error('VITE_META_API_URL not set')
    const r = await fetch(this.endpoint); if (!r.ok) throw new Error(`Meta API ${r.status}`)
    const d = await r.json() as Payload
    for (const v of Object.values(d.byChampion)) { v.source = v.source ?? d.source; v.patch = v.patch ?? d.patch }
    return { source: d.source, patch: d.patch, byChampion: d.byChampion, rolesByChampion: d.rolesByChampion }
  }
}
