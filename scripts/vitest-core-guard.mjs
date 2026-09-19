// Vitest `globalSetup` for the adapters: refuse to test against a stale core.
// See scripts/check-core-dist.mjs.
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { assertCoreDist } from "./check-core-dist.mjs";

export default function setup() {
  assertCoreDist(resolve(fileURLToPath(new URL("..", import.meta.url))));
}
