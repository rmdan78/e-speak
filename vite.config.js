import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ command }) => ({
  // Plugin basicSsl hanya diaktifkan saat 'serve' (npm run dev)
  // Saat 'build' (di Cloudflare), plugin ini akan dimatikan
  plugins: [
    react(),
    command === 'serve' ? basicSsl() : []
  ],
  server: {
    host: true,
    https: true,
    allowedHosts: ['824b22f1b0a7.ngrok-free.app', '.ngrok-free.app']
  },
  // Pastikan base path adalah root
  base: '/',
}))