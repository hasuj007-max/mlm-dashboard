import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La app se publica en https://hasuj007-max.github.io/mlm-dashboard/,
// por eso el base apunta a esa subruta
export default defineConfig({
  plugins: [react()],
  base: '/mlm-dashboard/',
})
