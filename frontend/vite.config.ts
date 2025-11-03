import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'copy-redirects',
      closeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'public/_redirects'),
            resolve(__dirname, 'dist/_redirects')
          )
          console.log('✅ _redirects copied to dist')
        } catch (err) {
          console.error('❌ Failed to copy _redirects:', err)
        }
      }
    }
  ],
  server: {
    allowedHosts: [
      '.ngrok-free.app', 
      'localhost' 
    ] 
  }
})
