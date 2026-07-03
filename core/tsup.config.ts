import { defineConfig } from "tsup";

export default defineConfig({
  // Preserve the source module structure (one output per input) instead of a
  // single bundle, so consumers' bundlers can tree-shake to just the primitives
  // they import (e.g. `import { calendar }` pulls only calendar's modules).
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
  format: ["esm"],
  // JS stays unbundled (tree-shakeable); the .d.ts is bundled from the root
  // entry into a single index.d.ts so namespace type re-exports resolve.
  dts: { entry: "src/index.ts" },
  // Cleaning is done by the build script (`rm -rf dist && tsup`): with
  // `clean: true` the ESM and DTS builds both clean `dist` concurrently and
  // intermittently race on unlink (ENOENT), failing the build under turbo.
  clean: false,
  sourcemap: true,
  bundle: false,
  treeshake: true,
});
