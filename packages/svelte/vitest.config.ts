import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    // Refuse to run against a core/dist built from other sources; see
    // scripts/check-core-dist.mjs.
    globalSetup: ["../../scripts/vitest-core-guard.mjs"],
    environment: "jsdom",
    fileParallelism: false,
    setupFiles: ["./vitest-setup.ts"],
    testTimeout: 10_000,
  },
});
