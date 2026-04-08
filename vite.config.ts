import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Emprestflow',
        short_name: 'Emprestflow',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#065f46',
        icons: [
          {
            src: '/pwa-192x192.png',  // ← nome correto
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',  // ← nome correto
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})