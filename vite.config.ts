import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import terser from "@rollup/plugin-terser";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: "terser",
    rollupOptions: {
      input: "src/index.ts",
      output: {
        dir: "dist",
        entryFileNames: "photogrammetry-viewer.js",
        format: "es"
      },
      plugins: [terser({ format: { comments: false } })],
    },
  },
  plugins: [
    dts({ insertTypesEntry: true }),
  ]
});
