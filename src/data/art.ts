// Champion art URLs, sourced from the active champion-data provider
// (Data Dragon). Components import these instead of touching providers.
import { championDataProvider } from './providers/registry'

export const splashUrl = (id: string) => championDataProvider.splashUrl(id)
export const loadingUrl = (id: string) => championDataProvider.loadingUrl(id)
export const squareUrl = (id: string) => championDataProvider.squareUrl(id)
