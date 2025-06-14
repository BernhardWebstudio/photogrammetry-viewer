import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    minify: "terser",
    lib: {
      entry: "src/photogrammetry-viewer.ts",
      fileName: "photogrammetry-viewer-without-modelviewer",
      formats: ["es"],
    },
    rollupOptions: {
      input: "src/index.ts",
      output: {
        dir: "dist",
        entryFileNames: "photogrammetry-viewer-without-modelviewer.js",
        format: "es"
      },
      plugins: [terser({ format: { comments: false } })],
    },
  },
  plugins: [dts({ insertTypesEntry: true }), peerDepsExternal()],
});
