// Record which sources core/dist is built from; scripts/check-core-dist.mjs
// reads it before any adapter test runs.
//
// Run twice by the build: first, right after the clean, to record the hash
// before tsup starts; then with `--verify` at the end, to fail the build if a
// source changed while it ran. The record waits under a pending name until
// the build has succeeded, so a failed build leaves no stamp behind.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { hashCoreSources } from "../../scripts/source-hash.mjs";

const coreDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pending = resolve(coreDir, "dist/.build-info.pending.json");
const final = resolve(coreDir, "dist/.build-info.json");
const sourceHash = hashCoreSources(coreDir);

if (process.argv.includes("--verify")) {
  const recorded = existsSync(pending)
    ? JSON.parse(readFileSync(pending, "utf8")).sourceHash
    : null;
  if (recorded !== sourceHash) {
    console.error("core/src changed while the build ran: run the build again.");
    process.exit(1);
  }
  renameSync(pending, final);
} else {
  mkdirSync(resolve(coreDir, "dist"), { recursive: true });
  writeFileSync(pending, JSON.stringify({ sourceHash }, null, 2) + "\n");
}
