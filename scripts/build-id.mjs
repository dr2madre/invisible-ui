// Stamp a built site with what it was built from, and check a served stamp.
//
// Playwright serves `dist` and, before any test, reads `.build-id.json` from
// the server it reached (e2e/global-setup.ts). A server from another
// checkout, from another commit, or built from other sources is refused
// there instead of quietly passing another tree's tests.
//
// The stamp names no path: the checkout is a fingerprint (a hash of host and
// root), so the file can sit on the public docs site.
//
// Works as an Astro integration (`astro:build:done`) and as a Vite plugin
// (`closeBundle`), so the docs and the Vue example write the same file.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { hostname } from "node:os";
import { realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashInputs } from "./source-hash.mjs";

export const BUILD_ID_FILE = ".build-id.json";

/** What each served site is built from, relative to the repository root. */
export const SITE_INPUTS = {
  docs: [
    "packages/docs/src",
    "packages/docs/public",
    "packages/docs/astro.config.mjs",
    "packages/docs/ec.config.mjs",
    "packages/docs/svelte.config.js",
    "packages/docs/package.json",
    "packages/svelte/src",
    "core/src",
    "pnpm-lock.yaml",
  ],
  "vue-example": [
    "examples/vue/src",
    "examples/vue/index.html",
    "examples/vue/harness.html",
    "examples/vue/react-harness.html",
    "examples/vue/elements-harness.html",
    "examples/vue/vite.config.ts",
    "examples/vue/package.json",
    "packages/vue/src",
    "packages/react/src",
    "packages/elements/src",
    "core/src",
    "pnpm-lock.yaml",
  ],
};

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

/** A short, non-reversible name for "this checkout on this machine". */
export function checkoutFingerprint(repoRoot) {
  let root = repoRoot;
  try {
    root = realpathSync(repoRoot);
  } catch {
    // An unreadable root still gets a stable name.
  }
  return createHash("sha256").update(`${hostname()}\0${root}`).digest("hex").slice(0, 16);
}

/** What the setup expects a served stamp to say for `site`. */
export function expectedBuildId(site, repoRoot) {
  return {
    site,
    checkout: checkoutFingerprint(repoRoot),
    head: git(["rev-parse", "HEAD"], repoRoot),
    inputs: hashInputs(repoRoot, SITE_INPUTS[site]),
  };
}

export function buildId(site, repoRoot) {
  return { ...expectedBuildId(site, repoRoot), builtAt: new Date().toISOString() };
}

export function writeBuildId(site, outDir, repoRoot) {
  writeFileSync(
    join(outDir, BUILD_ID_FILE),
    JSON.stringify(buildId(site, repoRoot), null, 2) + "\n",
  );
}

/**
 * Why a served stamp is not acceptable, or null. Identity (checkout, commit)
 * is never negotiable; `allowStale` skips only the inputs rule.
 */
export function verifyBuildId(served, expected, { allowStale = false } = {}) {
  if (!served || typeof served !== "object") {
    return "no build stamp: the server serves a build from before this check, or another project.";
  }
  if (served.checkout !== expected.checkout) {
    return "the server serves another checkout. Stop it, then run again.";
  }
  if (served.head !== expected.head) {
    return `the served build is from commit ${String(served.head).slice(0, 7)}, HEAD is ${String(expected.head).slice(0, 7)}. Rebuild.`;
  }
  if (served.inputs !== expected.inputs) {
    if (allowStale) return null;
    return "a source of this site changed after the served build. Rebuild, or set DS_E2E_ALLOW_STALE=1 knowingly.";
  }
  return null;
}

/** Astro integration. */
export function buildIdIntegration(site, repoRoot) {
  return {
    name: "build-id",
    hooks: {
      "astro:build:done": ({ dir }) => writeBuildId(site, new URL(dir).pathname, repoRoot),
    },
  };
}

/** Vite plugin. */
export function buildIdPlugin(site, repoRoot) {
  let outDir = "dist";
  return {
    name: "build-id",
    apply: "build",
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      writeBuildId(site, outDir, repoRoot);
    },
  };
}
