import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Definir rutas de certificados
const keyPath = path.resolve(__dirname, 'server.key');
const certPath = path.resolve(__dirname, 'server.crt');

// Configuración HTTPS condicional
let httpsConfig = false;
try {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log('🔒 HTTPS Habilitado con certificados personalizados');
  } else {
    console.log('⚠️ Certificados no encontrados (server.key, server.crt). Se usará HTTP.');
  }
} catch (e) {
  console.error('Error cargando certificados:', e);
}

import { VitePWA } from 'vite-plugin-pwa'

// ... imports existentes

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'MogoCounts',
        short_name: 'MogoCounts',
        description: 'Gestión de gastos compartidos',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    // Habilitar acceso desde red local
    host: true,
    // Configuración HTTPS
    https: httpsConfig,
    // Proxy para desarrollo local
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
