import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La app vive en Firebase Hosting (https://mi-red-hasuj.firebaseapp.com), en la raíz.
// GitHub Pages la sirve en /mlm-dashboard/: su workflow compila con BASE=/mlm-dashboard/.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE || '/',
})
