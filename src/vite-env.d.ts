/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_META_API_URL?: string; readonly VITE_DDRAGON_LOCALE?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
