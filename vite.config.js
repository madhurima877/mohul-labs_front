import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Go API runs on :8080; proxying /api avoids CORS in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080' },
  },
})
