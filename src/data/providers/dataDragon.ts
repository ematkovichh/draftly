import type { BaseStats, ChampClass, RiotInfo, Role } from '../../core/types'
import type { ChampionDataProvider, ChampionDataResult, RawChampion } from './types'

const HOST = 'https://ddragon.leagueoflegends.com'
const VALID_CLASSES: ChampClass[] = ['Fighter','Tank','Mage','Assassin','Marksman','Support']

// ── Role inference from real champion attributes ──────────────────────
// Riot provides no official lane data. These inference rules are derived
// from class/stats/partype and are intentionally multi-role so champions
// like Gragas/Pantheon/Taliyah appear everywhere they're actually played.
// A connected MetaStatsProvider overrides this with live role pick rates.
function inferRoles(id: string, tags: ChampClass[], stats: BaseStats, partype: string): Role[] {
  const roles = new Set<Role>()
  const isMelee = stats.attackrange < 350
  const hasEnergy = partype === 'Energy'

  // Tank: top, jungle (+ support if no attack class)
  if (tags.includes('Tank')) {
    roles.add('top'); roles.add('jungle')
    if (!tags.includes('Fighter')) roles.add('support')
  }
  // Fighter: top, jungle (some also mid)
  if (tags.includes('Fighter')) {
    roles.add('top'); roles.add('jungle')
  }
  // Assassin: mid, jungle (+ top if melee)
  if (tags.includes('Assassin')) {
    roles.add('mid'); roles.add('jungle')
    if (isMelee) roles.add('top')
  }
  // Mage: mid (+ support if also Support class; + jungle if high base stats)
  if (tags.includes('Mage')) {
    roles.add('mid')
    if (tags.includes('Support')) { roles.add('support') }
    if (stats.hp >= 620) roles.add('jungle') // tanky mages (Amumu-adjacent)
  }
  // Marksman: always adc, some also mid
  if (tags.includes('Marksman')) {
    roles.add('adc')
    if (!isMelee) {
      // high-skill marksmen who go mid
      if (['Corki','Tristana','Lucian','Ezreal'].includes(id)) roles.add('mid')
    }
  }
  // Support: always support, some also mid/top
  if (tags.includes('Support')) {
    roles.add('support')
    if (tags.includes('Mage') && !tags.includes('Tank')) roles.add('mid')
  }
  // Energy users (Akali, Zed, Lee Sin, Kennen, Shen…): fine-tune
  if (hasEnergy && tags.includes('Fighter')) { roles.add('top'); roles.add('jungle') }

  // Champion-specific overrides for well-known flex picks
  const flex: Record<string, Role[]> = {
    Gragas: ['top','jungle','mid','support'],
    Pantheon: ['top','jungle','mid','support'],
    Taliyah: ['mid','jungle'],
    Poppy: ['top','jungle','support'],
    Sett: ['top','jungle','support'],
    Galio: ['mid','support'],
    Seraphine: ['mid','support','adc'],
    Senna: ['support','adc'],
    Pyke: ['support','mid'],
    Nilah: ['adc','support'],
    Smolder: ['adc','mid'],
    Veigar: ['mid','support'],
    Zyra: ['support','mid'],
    Brand: ['support','mid'],
    Lux: ['mid','support'],
    Morgana: ['support','mid'],
    Karma: ['support','mid'],
    Heimerdinger: ['mid','top','support'],
    Kennen: ['top','mid'],
    Rumble: ['top','mid'],
    Vladimir: ['top','mid'],
    Cassiopeia: ['mid','top'],
    Swain: ['mid','support','top'],
    Neeko: ['mid','support'],
    Zilean: ['support','mid'],
    Orianna: ['mid'],
    Twisted: ['mid'],
    TwistedFate: ['mid'],
    Quinn: ['top','adc'],
    Graves: ['jungle','adc'],
    Kindred: ['jungle','adc'],
    MissFortune: ['adc','support'],
    Jhin: ['adc'],
    Ashe: ['adc','support'],
    Bard: ['support'],
    Thresh: ['support'],
    Blitzcrank: ['support'],
    Nautilus: ['support','jungle'],
    Leona: ['support'],
    Alistar: ['support','jungle'],
    Braum: ['support'],
    Rakan: ['support'],
    Yuumi: ['support'],
    Lulu: ['support','top'],
    Janna: ['support'],
    Nami: ['support'],
    Soraka: ['support'],
    Sona: ['support'],
  }
  if (flex[id]) return flex[id]

  return roles.size ? [...roles] : ['top']
}

interface DDStats extends BaseStats { [k: string]: number }
interface DDChamp {
  id: string; key: string; name: string; title: string
  tags: string[]; partype: string; info: RiotInfo; stats: DDStats
  passive: { name: string; description: string }
  spells: { name: string; description: string; tooltip: string }[]
}

function pickStats(s: DDStats): BaseStats {
  return { hp:s.hp, hpperlevel:s.hpperlevel, armor:s.armor, armorperlevel:s.armorperlevel,
    spellblock:s.spellblock, spellblockperlevel:s.spellblockperlevel,
    attackdamage:s.attackdamage, attackdamageperlevel:s.attackdamageperlevel,
    attackspeed:s.attackspeed, attackspeedperlevel:s.attackspeedperlevel,
    attackrange:s.attackrange, movespeed:s.movespeed, hpregen:s.hpregen, mp:s.mp }
}

export class DataDragonProvider implements ChampionDataProvider {
  readonly id = 'datadragon'
  readonly label = 'Riot Data Dragon'
  private version: string | null = null

  constructor(private locale = 'en_US') {}

  private async latestVersion(): Promise<string> {
    if (this.version) return this.version
    const r = await fetch(`${HOST}/api/versions.json`)
    if (!r.ok) throw new Error(`DDragon versions ${r.status}`)
    this.version = (await r.json() as string[])[0]
    return this.version
  }

  async fetchChampions(): Promise<ChampionDataResult> {
    const version = await this.latestVersion()
    const r = await fetch(`${HOST}/cdn/${version}/data/${this.locale}/championFull.json`)
    if (!r.ok) throw new Error(`DDragon championFull ${r.status}`)
    const json = (await r.json()) as { data: Record<string, DDChamp> }

    const champions: RawChampion[] = Object.values(json.data).map(c => ({
      id: c.id,
      key: Number(c.key),
      name: c.name,
      title: c.title,
      tags: c.tags.filter((t): t is ChampClass => VALID_CLASSES.includes(t as ChampClass)),
      partype: c.partype,
      info: c.info,
      stats: pickStats(c.stats),
      abilities: [
        { name: c.passive.name, description: c.passive.description },
        ...c.spells.map(s => ({ name: s.name, description: s.description, tooltip: s.tooltip })),
      ],
      // roles inferred from real attributes — override with meta provider for live data
      _roles: inferRoles(c.id, c.tags.filter((t): t is ChampClass => VALID_CLASSES.includes(t as ChampClass)), pickStats(c.stats), c.partype),
    } as RawChampion & { _roles: Role[] }))

    return { patch: version, source: this.label, champions }
  }

  splashUrl(id: string) { return `${HOST}/cdn/img/champion/splash/${id}_0.jpg` }
  loadingUrl(id: string) { return `${HOST}/cdn/img/champion/loading/${id}_0.jpg` }
  squareUrl(id: string) { return `${HOST}/cdn/${this.version ?? 'latest'}/img/champion/${id}.png` }
}
