// ── Data Dragon provider (REAL, live, no API key) ────────────────────
// Pulls the latest patch's full champion dataset — base stats, Riot info
// ratings, class tags, and complete spell/passive text — in one request,
// plus official splash/loading/square art URLs.
//
// Endpoints (all CORS-enabled, public):
//   https://ddragon.leagueoflegends.com/api/versions.json
//   https://ddragon.leagueoflegends.com/cdn/<ver>/data/<locale>/championFull.json
//   https://ddragon.leagueoflegends.com/cdn/img/champion/{splash,loading}/<id>_0.jpg
//   https://ddragon.leagueoflegends.com/cdn/<ver>/img/champion/<id>.png

import type {
  ChampionDataProvider,
  ChampionDataResult,
  RawChampion,
} from './types'
import type { BaseStats, ChampClass, RiotInfo } from '../../core/types'

const HOST = 'https://ddragon.leagueoflegends.com'

interface DDStats extends BaseStats {
  [k: string]: number
}
interface DDChampion {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  partype: string
  info: RiotInfo
  stats: DDStats
  passive: { name: string; description: string }
  spells: { name: string; description: string; tooltip: string }[]
}

const VALID_CLASSES: ChampClass[] = [
  'Fighter',
  'Tank',
  'Mage',
  'Assassin',
  'Marksman',
  'Support',
]

function pickStats(s: DDStats): BaseStats {
  return {
    hp: s.hp,
    hpperlevel: s.hpperlevel,
    armor: s.armor,
    armorperlevel: s.armorperlevel,
    spellblock: s.spellblock,
    spellblockperlevel: s.spellblockperlevel,
    attackdamage: s.attackdamage,
    attackdamageperlevel: s.attackdamageperlevel,
    attackspeed: s.attackspeed,
    attackspeedperlevel: s.attackspeedperlevel,
    attackrange: s.attackrange,
    movespeed: s.movespeed,
    hpregen: s.hpregen,
    mp: s.mp,
  }
}

export class DataDragonProvider implements ChampionDataProvider {
  readonly id = 'datadragon'
  readonly label = 'Riot Data Dragon'
  private version: string | null = null

  constructor(private locale = 'en_US') {}

  private async latestVersion(): Promise<string> {
    if (this.version) return this.version
    const res = await fetch(`${HOST}/api/versions.json`)
    if (!res.ok) throw new Error(`Data Dragon versions ${res.status}`)
    const versions: string[] = await res.json()
    this.version = versions[0]
    return this.version
  }

  async fetchChampions(): Promise<ChampionDataResult> {
    const version = await this.latestVersion()
    const res = await fetch(
      `${HOST}/cdn/${version}/data/${this.locale}/championFull.json`,
    )
    if (!res.ok) throw new Error(`Data Dragon championFull ${res.status}`)
    const json = (await res.json()) as { data: Record<string, DDChampion> }

    const champions: RawChampion[] = Object.values(json.data).map((c) => ({
      id: c.id,
      key: Number(c.key),
      name: c.name,
      title: c.title,
      tags: c.tags.filter((t): t is ChampClass =>
        VALID_CLASSES.includes(t as ChampClass),
      ),
      partype: c.partype,
      info: c.info,
      stats: pickStats(c.stats),
      abilities: [
        { name: c.passive.name, description: c.passive.description },
        ...c.spells.map((s) => ({
          name: s.name,
          description: s.description,
          tooltip: s.tooltip,
        })),
      ],
    }))

    return { patch: version, source: this.label, champions }
  }

  splashUrl(id: string) {
    return `${HOST}/cdn/img/champion/splash/${id}_0.jpg`
  }
  loadingUrl(id: string) {
    return `${HOST}/cdn/img/champion/loading/${id}_0.jpg`
  }
  squareUrl(id: string) {
    const v = this.version ?? 'latest'
    return `${HOST}/cdn/${v}/img/champion/${id}.png`
  }
}
