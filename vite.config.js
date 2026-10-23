import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Two Go services: the customer API on :8080 and the staff API on :8081.
// Proxying both avoids CORS in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/staff-api': 'http://localhost:8081',
    },
  },
})
