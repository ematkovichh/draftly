import type { ChampionDataProvider, MetaStatsProvider } from './types'
import { DataDragonProvider } from './dataDragon'
import { NullMetaProvider } from './meta/nullMeta'
import { HttpMetaProvider } from './meta/httpMeta'

const META_URL = import.meta.env.VITE_META_API_URL as string | undefined
const LOCALE = (import.meta.env.VITE_DDRAGON_LOCALE as string) || 'en_US'

export const championDataProvider: ChampionDataProvider = new DataDragonProvider(LOCALE)
export const metaStatsProvider: MetaStatsProvider = META_URL ? new HttpMetaProvider(META_URL) : new NullMetaProvider()
