import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Storybook's @storybook/svelte-vite builder loads this config but does not add
// the Svelte plugin itself, so we provide it here. Vitest keeps using
// vitest.config.ts (which has its own Svelte plugin), so the two don't clash.
export default defineConfig({
  plugins: [svelte()],
});
