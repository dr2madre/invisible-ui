import { defineConfig } from "tsup";

export default defineConfig([
  {
    // The entry for bundled apps: the app's bundler resolves the two
    // dependencies from node_modules. Core ships one file per module (see
    // core/tsup.config.ts), so importing one element pulls only its own
    // primitives. Inlining core here would merge every primitive into one
    // file and defeat that. scripts/check-elements-dist.mjs holds this.
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ["@design-system/core", "@floating-ui/dom"],
  },
  {
    // The script-tag adapter: the dist must be self-contained so a
    // no-build page can load it without an import map. Bundle everything.
    entry: ["src/define.ts"],
    format: ["esm"],
    dts: true,
    clean: false,
    sourcemap: true,
    noExternal: ["@design-system/core", "@floating-ui/dom"],
  },
]);
