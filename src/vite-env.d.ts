/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional endpoint for a meta-stats provider (win/pick/ban/counters). */
  readonly VITE_META_API_URL?: string
  /** Optional Data Dragon locale (defaults to en_US). */
  readonly VITE_DDRAGON_LOCALE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
