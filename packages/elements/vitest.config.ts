import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Refuse to run against a core/dist built from other sources; see
    // scripts/check-core-dist.mjs.
    globalSetup: ["../../scripts/vitest-core-guard.mjs"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest-setup.ts"],
    testTimeout: 10_000,
  },
});
