// One hash for the files that shape a build output. Content, not
// modification time: a checkout or a stash touches every file without
// changing what the build would produce.
//
// `hashCoreSources` covers `core/dist`; `hashInputs` is the general form.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Directories that never feed a build: generated, cached, installed. */
const SKIP_DIRS = new Set(["node_modules", "dist", ".astro", ".turbo", ".vite"]);
const isTest = (name) => /\.test\.[cm]?[jt]sx?$/.test(name);

function walk(path, keep, out) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const name of readdirSync(path).sort()) {
      if (!SKIP_DIRS.has(name)) walk(join(path, name), keep, out);
    }
  } else if (keep(path)) {
    out.push(path);
  }
  return out;
}

/**
 * sha256 over the sorted relative paths and contents of every file under the
 * given entries (files or directories, relative to `root`). Paths are hashed
 * with forward slashes, so the value is the same on every OS. A missing entry
 * is hashed as absent, so adding it later changes the hash.
 */
export function hashInputs(root, entries, keep = (path) => !isTest(path)) {
  const hash = createHash("sha256");
  for (const entry of [...entries].sort()) {
    const absolute = join(root, entry);
    if (!existsSync(absolute)) {
      hash.update(`${entry}\0absent\0`);
      continue;
    }
    for (const file of walk(absolute, keep, [])) {
      hash.update(relative(root, file).split(sep).join("/"));
      hash.update("\0");
      hash.update(readFileSync(file));
      hash.update("\0");
    }
  }
  return hash.digest("hex");
}

// Beside the sources: tsup's config and the tsconfigs its dts build reads, the
// build scripts, and the lockfile that pins tsup, esbuild and TypeScript.
const CORE_EXTRA = [
  "package.json",
  "tsup.config.ts",
  "tsconfig.json",
  "../tsconfig.base.json",
  "../pnpm-lock.yaml",
  "scripts/clean-dist.mjs",
  "scripts/patch-esm-specifiers.mjs",
];

/** Under `src`, only the TypeScript tsup compiles; the extra files as listed. */
const keepForCore = (path) => {
  if (isTest(path)) return false;
  const underSrc = path.includes(`${sep}src${sep}`);
  return underSrc ? path.endsWith(".ts") : true;
};

/** @param {string} coreDir absolute path to `core/` */
export function hashCoreSources(coreDir) {
  return hashInputs(coreDir, ["src", ...CORE_EXTRA], keepForCore);
}
