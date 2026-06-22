// ── Champion service ─────────────────────────────────────────────────
// Orchestrates everything into a normalised roster:
//   1. real champion data from the ChampionDataProvider (Data Dragon)
//   2. real meta stats from the MetaStatsProvider (if connected)
//   3. factual role/yordle reference (overridden by live roles if provided)
//   4. derive raw metrics from real attributes
//   5. percentile-normalise across the roster
//   6. derive archetypes from the normalised ratings

import type {
  Champion,
  DatasetInfo,
  MetaStats,
  RawMetrics,
  Role,
} from '../core/types'
import { championDataProvider, metaStatsProvider } from '../data/providers/registry'
import reference from '../data/reference/championReference.json'
import { deriveRawMetrics, rangeTypeFrom, damageTypeFrom } from '../core/analysis/derive'
import { normalizeRoster } from '../core/analysis/engine'
import { deriveArchetypes } from '../core/analysis/archetype'

const REF = reference as {
  roles: Record<string, Role[]>
  yordles: string[]
  offMetaReference: string[]
}

export interface ChampionDataset {
  champions: Champion[]
  byId: Map<string, Champion>
  info: DatasetInfo
}

export async function loadChampions(): Promise<ChampionDataset> {
  const data = await championDataProvider.fetchChampions()

  // Meta stats are optional and only used if a provider is actually connected.
  let meta: { byChampion: Record<string, MetaStats>; rolesByChampion?: Record<string, Role[]>; source: string; patch: string } | null = null
  try {
    if (await metaStatsProvider.isAvailable()) {
      const result = await metaStatsProvider.fetchMeta()
      meta = {
        byChampion: result.byChampion,
        rolesByChampion: result.rolesByChampion,
        source: result.source,
        patch: result.patch,
      }
    }
  } catch (err) {
    // Never block on meta; champion attributes alone are enough to analyse.
    console.warn('Meta provider unavailable:', err)
  }

  // Keep only champions we can place in a role (reference or live meta roles).
  const placed = data.champions.filter(
    (c) => REF.roles[c.id] || meta?.rolesByChampion?.[c.id],
  )

  const rawMetrics: RawMetrics[] = placed.map((c) =>
    deriveRawMetrics({
      info: c.info,
      base: c.stats,
      classes: c.tags,
      abilities: c.abilities,
    }),
  )
  const ratingsList = normalizeRoster(rawMetrics)

  const champions: Champion[] = placed.map((c, i) => {
    const ratings = ratingsList[i]
    const rangeType = rangeTypeFrom(c.stats)
    const roles = meta?.rolesByChampion?.[c.id] ?? REF.roles[c.id] ?? []
    return {
      id: c.id,
      key: c.key,
      name: c.name,
      title: c.title,
      classes: c.tags,
      partype: c.partype,
      roles,
      damageType: damageTypeFrom(c.info),
      rangeType,
      yordle: REF.yordles.includes(c.id),
      offMetaReference: REF.offMetaReference.includes(c.id),
      info: c.info,
      base: c.stats,
      rawMetrics: rawMetrics[i],
      ratings,
      archetypes: deriveArchetypes(ratings, c.tags, rangeType),
      meta: meta?.byChampion[c.id] ?? null,
    }
  })

  const byId = new Map(champions.map((c) => [c.id, c]))
  const info: DatasetInfo = {
    patch: data.patch,
    championDataSource: data.source,
    metaSource: meta?.source ?? null,
    championCount: champions.length,
  }
  return { champions, byId, info }
}
