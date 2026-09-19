// One hash for the files that shape a build output. Content, not
// modification time: a checkout or a stash touches every file without
// changing what the build would produce.
//
// `hashPackageSources` covers a package's dist; `hashInputs` is the general form.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Directories that never feed a build: generated, cached, installed. */
const SKIP_DIRS = new Set(["node_modules", "dist", ".astro", ".turbo", ".vite"]);
const isTest = (rel) => /\.test\.[cm]?[jt]sx?$/.test(rel);

/** `root`-relative path with forward slashes: the same on every OS. */
const relPath = (root, file) => relative(root, file).split(sep).join("/");

function walk(root, path, keep, out) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const name of readdirSync(path).sort()) {
      if (!SKIP_DIRS.has(name)) walk(root, join(path, name), keep, out);
    }
  } else if (keep(relPath(root, path))) {
    out.push(path);
  }
  return out;
}

/**
 * sha256 over the sorted relative paths and contents of every file under the
 * given entries (files or directories, relative to `root`). `keep` sees the
 * root-relative path, never the absolute one: what the checkout is called
 * must not change what is hashed. A missing entry is hashed as absent, so
 * adding it later changes the hash.
 */
export function hashInputs(root, entries, keep = (rel) => !isTest(rel)) {
  const hash = createHash("sha256");
  for (const entry of [...entries].sort()) {
    const absolute = join(root, entry);
    if (!existsSync(absolute)) {
      hash.update(`${entry}\0absent\0`);
      continue;
    }
    for (const file of walk(root, absolute, keep, [])) {
      hash.update(relPath(root, file));
      hash.update("\0");
      hash.update(readFileSync(file));
      hash.update("\0");
    }
  }
  return hash.digest("hex");
}

/**
 * What shapes a workspace package's dist: everything under `src` except
 * tests (core: only the TypeScript tsup compiles), the package manifest,
 * tsup's config, the tsconfigs its dts build reads, and the lockfile that
 * pins the toolchain. `pkgRel` is the package directory relative to the
 * repository root ("core", "packages/svelte").
 */
export function hashPackageSources(repoRoot, pkgRel) {
  const entries = [
    `${pkgRel}/src`,
    `${pkgRel}/package.json`,
    `${pkgRel}/tsup.config.ts`,
    `${pkgRel}/tsconfig.json`,
    "tsconfig.base.json",
    "pnpm-lock.yaml",
  ];
  if (pkgRel === "core") {
    entries.push("core/scripts/clean-dist.mjs", "core/scripts/patch-esm-specifiers.mjs");
  }
  const keep = pkgRel === "core" ? keepCoreRel(pkgRel) : (rel) => !isTest(rel);
  return hashInputs(repoRoot, entries, keep);
}

/** Under core's `src`, only the TypeScript tsup compiles. */
const keepCoreRel = (pkgRel) => (rel) => {
  if (isTest(rel)) return false;
  return rel.startsWith(`${pkgRel}/src/`) ? rel.endsWith(".ts") : true;
};
