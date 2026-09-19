// Stamp a built site with where and from what it was built.
//
// Playwright serves `dist` and, before any test, reads this file from the
// server it reached (`e2e/global-setup.ts`). A server from another checkout,
// or a dist older than the sources, is refused there instead of quietly
// passing another tree's tests.
//
// Works as an Astro integration (`astro:build:done`) and as a Vite plugin
// (`closeBundle`), so the docs and the Vue example write the same file.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export const BUILD_ID_FILE = ".build-id.json";

function git(args, cwd) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** @param {string} repoRoot absolute path of the repository root */
export function buildId(repoRoot) {
  return {
    root: repoRoot,
    head: git(["rev-parse", "HEAD"], repoRoot),
    // Any uncommitted change under the sources or the site itself.
    dirty: (git(["status", "--porcelain", "--untracked-files=no"], repoRoot) ?? "") !== "",
    builtAt: new Date().toISOString(),
  };
}

export function writeBuildId(outDir, repoRoot) {
  writeFileSync(join(outDir, BUILD_ID_FILE), JSON.stringify(buildId(repoRoot), null, 2) + "\n");
}

/** Astro integration. */
export function buildIdIntegration(repoRoot) {
  return {
    name: "build-id",
    hooks: {
      "astro:build:done": ({ dir }) => writeBuildId(new URL(dir).pathname, repoRoot),
    },
  };
}

/** Vite plugin. */
export function buildIdPlugin(repoRoot) {
  let outDir = "dist";
  return {
    name: "build-id",
    apply: "build",
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      writeBuildId(outDir, repoRoot);
    },
  };
}
