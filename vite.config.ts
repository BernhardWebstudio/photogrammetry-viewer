import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/photogrammetry-viewer.ts',
      formats: ['es'],
    },
    minify: 'terser',
    rollupOptions: {
      plugins: [terser({ format: { comments: false } })],
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
})

