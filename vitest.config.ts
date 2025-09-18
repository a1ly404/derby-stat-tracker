/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Use happy-dom instead of jsdom for better CI compatibility
    environment: 'happy-dom',
    setupFiles: resolve(__dirname, 'src/test/setup.ts'),
    css: true,
    // Add pool configuration to avoid issues in CI
    pool: 'forks',
    // Ensure proper environment isolation
    isolate: true,
  },
})