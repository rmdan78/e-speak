import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
    allowedHosts: ['824b22f1b0a7.ngrok-free.app', '.ngrok-free.app']
  }
})
