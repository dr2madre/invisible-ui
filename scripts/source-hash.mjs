// One hash for everything that shapes `core/dist`: the sources tsup compiles,
// its config, and the scripts the build runs afterwards. Tests are left out,
// since they never reach dist.
//
// The core build writes this hash into `core/dist/.build-info.json`; the
// adapters' test guard recomputes it and refuses to run when the two differ.
// Content, not modification time: a checkout or a stash touches every file
// without changing what dist would contain.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const EXTRA = [
  "package.json",
  "tsup.config.ts",
  "scripts/clean-dist.mjs",
  "scripts/patch-esm-specifiers.mjs",
];

function walk(dir, out) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) out.push(path);
  }
  return out;
}

/** @param {string} coreDir absolute path to `core/` */
export function hashCoreSources(coreDir) {
  const files = walk(join(coreDir, "src"), []);
  for (const rel of EXTRA) files.push(join(coreDir, rel));
  const hash = createHash("sha256");
  for (const file of files) {
    // Paths are hashed with forward slashes so the value is the same on every OS.
    hash.update(relative(coreDir, file).split(sep).join("/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}
