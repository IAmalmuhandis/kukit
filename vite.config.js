import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Forwards API calls to the local Express server during `npm run dev`
    // so the frontend can always just fetch relative "/api/..." paths.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'KUKIT',
        short_name: 'KUKIT',
        description:
          'KUKIT — built-in cook times, multiple simultaneous timers, and a loud alarm so you stop burning dinner while multitasking.',
        theme_color: '#1a1815',
        background_color: '#1a1815',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      // Installing as a standalone window is what keeps this timer running
      // reliably instead of getting throttled as a background browser tab.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png}'],
      },
    }),
  ],
})
