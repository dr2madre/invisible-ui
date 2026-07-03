import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: "jsdom",
    fileParallelism: false,
    setupFiles: ["./vitest-setup.ts"],
    testTimeout: 10_000,
  },
});
