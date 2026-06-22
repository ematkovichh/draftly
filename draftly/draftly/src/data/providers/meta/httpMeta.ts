// ── HTTP meta provider (skeleton — wire to a real backend/proxy) ─────
// Win/pick/ban/counters/synergies are NOT available from any official,
// free, browser-callable endpoint. The two realistic sources are:
//
//   1. Riot MATCH-V5 aggregated on YOUR backend (official, needs a
//      production key; you ingest matches and compute the rates).
//   2. A third-party stats source (U.GG / OP.GG / Lolalytics). These are
//      unofficial and CORS-blocked from the browser, so they must be
//      proxied by a small serverless function that adds CORS headers and
//      normalises the payload.
//
// Either way, the browser talks to ONE endpoint you control, which returns
// JSON in the normalised shape below. Set VITE_META_API_URL to enable it.
//
// Expected response from `${VITE_META_API_URL}` :
//   {
//     "source": "U.GG (proxied)",
//     "patch": "14.x",
//     "byChampion": {
//       "Aatrox": { "winRate": 50.3, "pickRate": 8.1, "banRate": 3.2,
//                   "counters": [{ "championId": "Fiora", "winRateAgainst": 46.0 }],
//                   "synergies": [] }
//     },
//     "rolesByChampion": { "Aatrox": ["top"] }
//   }

import type { MetaStats } from '../../../core/types'
import type { MetaStatsProvider, MetaStatsResult } from '../types'

interface HttpPayload {
  source: string
  patch: string
  byChampion: Record<string, MetaStats>
  rolesByChampion?: MetaStatsResult['rolesByChampion']
}

export class HttpMetaProvider implements MetaStatsProvider {
  readonly id = 'http'
  readonly label = 'External stats API'

  constructor(private endpoint: string | undefined) {}

  isAvailable() {
    return Boolean(this.endpoint)
  }

  async fetchMeta(): Promise<MetaStatsResult> {
    if (!this.endpoint) throw new Error('VITE_META_API_URL is not set')
    const res = await fetch(this.endpoint)
    if (!res.ok) throw new Error(`Meta API ${res.status}`)
    const data = (await res.json()) as HttpPayload
    // Stamp the source onto each record so the engine can report provenance.
    for (const v of Object.values(data.byChampion)) {
      v.source = v.source ?? data.source
      v.patch = v.patch ?? data.patch
    }
    return {
      source: data.source,
      patch: data.patch,
      byChampion: data.byChampion,
      rolesByChampion: data.rolesByChampion,
    }
  }
}
