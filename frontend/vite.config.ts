import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Fournit un DOM en mémoire : les composants React sont rendus hors navigateur.
    environment: 'jsdom',
    // describe / it / expect disponibles sans import dans chaque fichier de test.
    globals: true,
    // Exécuté avant chaque fichier de test : y brancher les matchers jest-dom.
    setupFiles: ['./src/test/setup.ts'],
  },
})
