import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// One self-contained HTML file (everything inlined) so it opens by
// double-click. Champion data is still fetched live from Riot Data Dragon
// in the browser at runtime.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: { outDir: 'preview', assetsInlineLimit: 100000000, cssCodeSplit: false },
})
