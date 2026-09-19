// Serve the built docs in the foreground, for Playwright's `webServer`.
//
// `astro preview` turns itself into a background daemon when it detects an
// agent in the environment (am-i-vibing) and then exits, which Playwright
// reads as the server having died. The programmatic API has no such switch.
// Astro's preview does not hold its port strictly, so a busy port is refused
// here rather than drifting to the next one.
//
//   node scripts/serve.mjs [--port 4321] [--host 127.0.0.1]

import { preview } from "astro";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  const value = args[i + 1];
  return i === -1 || value === undefined || value.startsWith("--") ? fallback : value;
};
const host = flag("host", "127.0.0.1");
const port = Number(flag("port", "4321"));

await new Promise((ready, busy) => {
  const probe = createServer();
  probe.once("error", (error) => busy(new Error(`port ${port} on ${host} is busy: ${error.code}`)));
  probe.listen(port, host, () => probe.close(ready));
});

const server = await preview({
  root: fileURLToPath(new URL("..", import.meta.url)),
  logLevel: "warn",
  server: { host, port },
});
console.log(`docs preview: http://${host}:${port}/invisible-ui/`);

const stop = () => server.stop().then(() => process.exit(0));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
