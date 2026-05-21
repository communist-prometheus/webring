import { defineConfig } from 'vite'

// Single self-contained ESM bundle for `<script type="module" src>`
// embedding. members.json is imported and inlined, so the fallback
// list ships inside the bundle (no runtime dependency).
export default defineConfig({
  build: {
    target: 'es2022',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'webring.js',
    },
    minify: 'esbuild',
    rollupOptions: {
      // No externals — everything is bundled into one file.
      output: { inlineDynamicImports: true },
    },
  },
})
