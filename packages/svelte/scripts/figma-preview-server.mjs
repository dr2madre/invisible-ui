import { createServer } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export function createPreviewServer(options) {
  return createServer({ ...options, plugins: [svelte({ configFile: false })] });
}
