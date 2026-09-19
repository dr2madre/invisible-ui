// Record which sources core/dist is built from; scripts/check-core-dist.mjs
// reads it before any adapter test runs.
//
// Run twice by the build: first, right after the clean, to record the hash
// before tsup starts; then with `--verify` at the end, to fail the build if a
// source changed while it ran. Recording after the fact would stamp a dist
// that lacks the edit.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { hashCoreSources } from "../../scripts/source-hash.mjs";

const coreDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const file = resolve(coreDir, "dist/.build-info.json");
const sourceHash = hashCoreSources(coreDir);

if (process.argv.includes("--verify")) {
  const recorded = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).sourceHash : null;
  if (recorded !== sourceHash) {
    console.error("core/src changed while the build ran: run the build again.");
    process.exit(1);
  }
} else {
  mkdirSync(resolve(coreDir, "dist"), { recursive: true });
  writeFileSync(file, JSON.stringify({ sourceHash }, null, 2) + "\n");
}
