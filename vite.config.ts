import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/dayframe-gada.svg', 'brand/dayframe-athlete.svg'],
      manifest: {
        name: 'Dayframe',
        short_name: 'Dayframe',
        description: 'A calm personal operating system for your health and life.',
        theme_color: '#181513',
        background_color: '#181513',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'brand/dayframe-athlete.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,woff2}'],
      },
    }),
  ],
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
