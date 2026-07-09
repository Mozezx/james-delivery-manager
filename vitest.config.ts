import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Config separada do vite.config.ts (que carrega o plugin do Tailwind,
// desnecessário para testes de funções puras em src/lib).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
})
