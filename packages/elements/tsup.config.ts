import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/define.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  // This is the script-tag adapter: the dist must be self-contained so a
  // no-build page can load it without an import map. Bundle everything.
  noExternal: ["@design-system/core", "@floating-ui/dom"],
});
