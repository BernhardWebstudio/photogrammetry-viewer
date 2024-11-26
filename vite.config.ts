import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

let plugins = [
  dts({
    insertTypesEntry: true,
  }),
];

if (process.env.NODE_ENV !== "local") {
  plugins.push(peerDepsExternal());
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "src/photogrammetry-viewer.ts",
      formats: ["es"],
    },
    minify: "terser",
    rollupOptions: {
      plugins: [terser({ format: { comments: false } })],
    },
  },
  plugins: plugins,
});
