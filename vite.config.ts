import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'SwasthyaLipi - OPD Portal',
        short_name: 'SwasthyaLipi',
        description: 'Bilingual patient intake and clinical summary application',
        theme_color: '#00d9a6',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  server: {
    port: 5173,
    open: true,
  },
})
