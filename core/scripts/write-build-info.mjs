// Last step of the core build: record which sources this dist was built from.
// `scripts/check-core-dist.mjs` reads it before any adapter test runs.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { hashCoreSources } from "../../scripts/source-hash.mjs";

const coreDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
writeFileSync(
  resolve(coreDir, "dist/.build-info.json"),
  JSON.stringify(
    { sourceHash: hashCoreSources(coreDir), builtAt: new Date().toISOString() },
    null,
    2,
  ) + "\n",
);
