/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // TODO: Update vitest to 4.X
  //       We have to wait until the reporter is fixed in jetbrains
  //       Ref: https://youtrack.jetbrains.com/issue/WEB-75191/No-tests-found-when-running-Vitest-4-tests
  test: {
    exclude: ['node_modules'],
    coverage: {
      reporter: ['json-summary', 'json'],
      reportOnFailure: true,
    }
  }
})
