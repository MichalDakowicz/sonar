import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/spotify-token': {
        target: 'https://accounts.spotify.com/api/token',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spotify-token/, ''),
      }
    }
  }
})
