import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // When using `netlify dev`, Vite runs behind Netlify's dev server
    // which handles the /api/* → /.netlify/functions/api/* redirects automatically.
    // If running standalone `npm run dev`, you can start the function locally
    // with `npx netlify functions:serve` and proxy to it:
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
