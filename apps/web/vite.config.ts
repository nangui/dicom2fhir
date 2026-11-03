import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin /api in dev, like the Vercel rewrite in prod: no CORS to configure.
    // Compose sets API_PROXY_TARGET=http://api:3001; on the host it is localhost.
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
})
