// Serve the built docs in the foreground, for Playwright's `webServer`.
//
// `astro preview` turns itself into a background daemon when it detects an
// agent in the environment (am-i-vibing) and then exits, which Playwright
// reads as the server having died. The programmatic API has no such switch.
//
//   node scripts/serve.mjs [--port 4321] [--host 127.0.0.1]

import { preview } from "astro";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const server = await preview({
  root: fileURLToPath(new URL("..", import.meta.url)),
  logLevel: "warn",
  server: { host: flag("host", "127.0.0.1"), port: Number(flag("port", "4321")) },
});

const stop = () => server.stop().then(() => process.exit(0));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
