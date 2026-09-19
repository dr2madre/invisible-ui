import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { buildIdPlugin } from "../../scripts/build-id.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");

export default defineConfig({
  // The build id lets Playwright refuse a server from another checkout.
  plugins: [vue(), buildIdPlugin("vue-example", repoRoot)],
  build: {
    rollupOptions: {
      input: {
        // The example itself, plus the page the browser tests drive.
        index: fileURLToPath(new URL("index.html", import.meta.url)),
        harness: fileURLToPath(new URL("harness.html", import.meta.url)),
        reactHarness: fileURLToPath(new URL("react-harness.html", import.meta.url)),
        elementsHarness: fileURLToPath(new URL("elements-harness.html", import.meta.url)),
      },
    },
  },
});
