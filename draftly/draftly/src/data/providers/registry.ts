// ── Provider registry ────────────────────────────────────────────────
// Single place where active providers are chosen. Swap or add providers
// here; nothing else in the app needs to change.

import type { ChampionDataProvider, MetaStatsProvider } from './types'
import { DataDragonProvider } from './dataDragon'
import { NullMetaProvider } from './meta/nullMeta'
import { HttpMetaProvider } from './meta/httpMeta'

// Configured via Vite env vars (see .env.example).
const META_API_URL = import.meta.env.VITE_META_API_URL as string | undefined
const LOCALE = (import.meta.env.VITE_DDRAGON_LOCALE as string) || 'en_US'

export const championDataProvider: ChampionDataProvider = new DataDragonProvider(
  LOCALE,
)

/**
 * Meta provider resolution: use the HTTP provider when an endpoint is
 * configured, otherwise fall back to the honest "not connected" provider.
 * Register additional providers (OP.GG, U.GG-direct, Riot-aggregation)
 * by adding cases here.
 */
export const metaStatsProvider: MetaStatsProvider = META_API_URL
  ? new HttpMetaProvider(META_API_URL)
  : new NullMetaProvider()
