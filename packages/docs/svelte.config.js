import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Mirror @invisible-ui/svelte: preprocess TS in <script lang="ts"> but let the
  // Svelte compiler scope the plain-CSS <style> blocks (style step off).
  preprocess: vitePreprocess({ style: false }),
};
