import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // Pure core is environment-agnostic; node is enough. The custom
    // element is covered by Playwright (real browser), not vitest.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
