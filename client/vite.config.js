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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Habilitar acceso desde red local
    host: true,
    // Configuración HTTPS
    https: httpsConfig
  }
})
