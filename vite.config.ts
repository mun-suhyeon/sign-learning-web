import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 저장소 하위 경로 (CLAUDE.md §15)
  base: '/sign-learning-web/',
  plugins: [react()],
})
