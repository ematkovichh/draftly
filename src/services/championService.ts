import type { Champion, DatasetInfo, MetaStats, RawMetrics, Role } from '../core/types'
import { championDataProvider, metaStatsProvider } from '../data/providers/registry'
import { deriveRawMetrics, rangeTypeFrom, damageTypeFrom } from '../core/analysis/derive'
import { normalizeRoster, deriveArchetypes } from '../core/analysis/engine'
import type { RawChampion } from '../data/providers/types'

// Lore-based yordle list (no official data field)
const YORDLES = new Set(['Corki','Heimerdinger','Kennen','Kled','Lulu','Poppy','Rumble','Teemo','Tristana','Veigar','Vex','Ziggs','Gnar','Kled'])
// Off-meta reference (low-presence picks)
const OFF_META_REF = new Set(['Teemo','Quinn','Heimerdinger','Singed','Mordekaiser','Fiddlesticks'])

export interface ChampionDataset { champions: Champion[]; byId: Map<string, Champion>; info: DatasetInfo }

export async function loadChampions(): Promise<ChampionDataset> {
  const data = await championDataProvider.fetchChampions()

  let meta: { byChampion: Record<string, MetaStats>; rolesByChampion?: Record<string, Role[]>; source: string } | null = null
  try {
    if (await metaStatsProvider.isAvailable()) {
      const r = await metaStatsProvider.fetchMeta()
      meta = { byChampion: r.byChampion, rolesByChampion: r.rolesByChampion, source: r.source }
    }
  } catch (e) { console.warn('Meta unavailable:', e) }

  const all = data.champions as (RawChampion & { _roles?: Role[] })[]
  const rawMetrics: RawMetrics[] = all.map(c => deriveRawMetrics(c.info, c.stats, c.tags, c.abilities))
  const ratingsList = normalizeRoster(rawMetrics)

  const champions: Champion[] = all.map((c, i) => {
    const roles = meta?.rolesByChampion?.[c.id] ?? (c as any)._roles ?? ['top']
    const ratings = ratingsList[i]
    return {
      id: c.id, key: c.key, name: c.name, title: c.title,
      classes: c.tags, partype: c.partype, roles,
      damageType: damageTypeFrom(c.info), rangeType: rangeTypeFrom(c.stats),
      archetypes: deriveArchetypes(ratings, c.tags),
      yordle: YORDLES.has(c.id), offMetaRef: OFF_META_REF.has(c.id),
      info: c.info, base: c.stats, rawMetrics: rawMetrics[i], ratings,
      meta: meta?.byChampion[c.id] ?? null,
    }
  })

  return {
    champions,
    byId: new Map(champions.map(c => [c.id, c])),
    info: { patch: data.patch, championDataSource: data.source, metaSource: meta?.source ?? null, championCount: champions.length },
  }
}
