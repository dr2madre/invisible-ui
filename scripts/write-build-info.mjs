#!/usr/bin/env node
// Record which sources a package's dist is built from.
//
//   node scripts/write-build-info.mjs <package dir>            # before the build
//   node scripts/write-build-info.mjs <package dir> --verify   # after it
//
// The first call drops any record the previous build left, then writes the
// hash of the sources to a pending file at the package root; the second
// recomputes it, fails the build if a source changed meanwhile, and only
// then writes `dist/.build-info.json`. A failed or interrupted build leaves
// no record in dist, and the pending file never sits inside the directory
// the bundler cleans. Readers: scripts/check-core-dist.mjs (the adapters'
// test guard) and scripts/build-id.mjs (the served sites' stamp).

import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { relative, resolve } from "node:path";
import { hashPackageSources } from "./source-hash.mjs";

export const PENDING_FILE = ".build-info.pending.json";
export const BUILD_INFO_FILE = "dist/.build-info.json";

export function recordPending(repoRoot, pkgDir) {
  const sourceHash = hashPackageSources(repoRoot, relative(repoRoot, pkgDir));
  // The old record goes first. A bundler that cleans its own output leaves
  // dotfiles in place, so a build that never finishes would otherwise keep
  // a record still claiming the dist is current.
  rmSync(resolve(pkgDir, BUILD_INFO_FILE), { force: true });
  writeFileSync(resolve(pkgDir, PENDING_FILE), JSON.stringify({ sourceHash }, null, 2) + "\n");
  return sourceHash;
}

/** The file the dist must hold for a build to count as finished. */
function packageEntry(pkgDir) {
  const manifest = JSON.parse(readFileSync(resolve(pkgDir, "package.json"), "utf8"));
  return manifest.main ?? "dist/index.js";
}

/** @returns {string | null} the problem, or null when the record was written */
export function verifyAndStamp(repoRoot, pkgDir) {
  const pending = resolve(pkgDir, PENDING_FILE);
  if (!existsSync(pending))
    return "no pending build record: run the whole build, not --verify alone.";
  const entry = packageEntry(pkgDir);
  if (!existsSync(resolve(pkgDir, entry)))
    return `the build wrote no ${entry}: run the whole build, not --verify alone.`;
  const recorded = JSON.parse(readFileSync(pending, "utf8")).sourceHash;
  const sourceHash = hashPackageSources(repoRoot, relative(repoRoot, pkgDir));
  if (recorded !== sourceHash) return "sources changed while the build ran: run the build again.";
  mkdirSync(resolve(pkgDir, "dist"), { recursive: true });
  writeFileSync(resolve(pkgDir, BUILD_INFO_FILE), JSON.stringify({ sourceHash }, null, 2) + "\n");
  unlinkSync(pending);
  return null;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const target = process.argv[2];
  if (!target || target.startsWith("--")) {
    console.error("usage: write-build-info.mjs <package dir> [--verify]");
    process.exit(2);
  }
  const pkgDir = resolve(repoRoot, target);
  if (process.argv.includes("--verify")) {
    const problem = verifyAndStamp(repoRoot, pkgDir);
    if (problem) {
      console.error(problem);
      process.exit(1);
    }
  } else {
    recordPending(repoRoot, pkgDir);
  }
}
