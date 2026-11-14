import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /dark-aphelion/ (see the gh-pages branch).
export default defineConfig({
  plugins: [react()],
  base: '/dark-aphelion/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
})
