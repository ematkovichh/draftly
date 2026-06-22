import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base lets the build work on GitHub Pages project sites
// (https://<user>.github.io/<repo>/) without hardcoding the repo name.
export default defineConfig({
  plugins: [react()],
  base: './',
})
