import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vue's esm-bundler build reads these compile-time feature flags; the Vue
  // Vite plugin would define them, but this package renders with `h()` only
  // (no SFCs, no template compiler), so the flags are defined here directly.
  define: {
    __VUE_OPTIONS_API__: "true",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest-setup.ts"],
    testTimeout: 10_000,
  },
});
