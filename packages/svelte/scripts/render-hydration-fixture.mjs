// Server-side render of the hydration fixture, run as a separate process: the
// hydration test spawns this with Node, where no DOM exists, and hydrates the
// printed HTML in its own browser-like runtime. Vite compiles the .svelte
// graph for the server, as an SSR build would.
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const server = await createServer({
  configFile: false,
  root,
  logLevel: "silent",
  server: { middlewareMode: true, hmr: false },
  plugins: [svelte()],
});

try {
  const entry = await server.ssrLoadModule("/src/lib/hydration-ssr-entry.ts");
  process.stdout.write(JSON.stringify(await entry.renderTwice()));
} finally {
  await server.close();
}
