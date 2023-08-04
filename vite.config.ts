import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: /^lit/,
    },  
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
})
