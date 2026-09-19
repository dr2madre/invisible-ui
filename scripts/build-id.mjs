// Stamp a built site with what it was built from, and check a served stamp.
//
// Playwright serves `dist` and, before any test, reads `.build-id.json` from
// the server it reached (e2e/global-setup.ts). A server from another
// checkout, or built from other sources, is refused there instead of quietly
// passing another tree's tests.
//
// The stamp names no path: the checkout is a fingerprint (a hash of the real
// root), so the file can sit on the public docs site. The commit is recorded
// for the message only: Turbo may restore a build made at an older commit,
// and if the site's inputs are unchanged, that build is this build.
//
// Works as an Astro integration (`astro:build:done`) and as a Vite plugin
// (`closeBundle`), so the docs and the Vue example write the same file.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashInputs } from "./source-hash.mjs";

export const BUILD_ID_FILE = ".build-id.json";

/**
 * What each served site is built from, relative to the repository root: its
 * own files, and for every workspace package it bundles both the sources and
 * the built output, with the build configuration between them. Core's dist is
 * represented by its build record, itself a hash of core's sources.
 */
const CORE = [
  "core/src",
  "core/dist/.build-info.json",
  "core/tsup.config.ts",
  "core/tsconfig.json",
];
const SHARED = ["tsconfig.base.json", "pnpm-lock.yaml"];
const bundled = (pkg) => [
  `${pkg}/src`,
  `${pkg}/dist`,
  `${pkg}/tsup.config.ts`,
  `${pkg}/tsconfig.json`,
  `${pkg}/package.json`,
];

export const SITE_INPUTS = {
  docs: [
    "packages/docs/src",
    "packages/docs/public",
    "packages/docs/astro.config.mjs",
    "packages/docs/ec.config.mjs",
    "packages/docs/svelte.config.js",
    "packages/docs/package.json",
    "packages/docs/tsconfig.json",
    ...bundled("packages/svelte"),
    ...CORE,
    ...SHARED,
  ],
  "vue-example": [
    "examples/vue/src",
    "examples/vue/index.html",
    "examples/vue/harness.html",
    "examples/vue/react-harness.html",
    "examples/vue/elements-harness.html",
    "examples/vue/vite.config.ts",
    "examples/vue/package.json",
    "examples/vue/tsconfig.json",
    ...bundled("packages/vue"),
    ...bundled("packages/react"),
    ...bundled("packages/elements"),
    ...CORE,
    ...SHARED,
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

/** A short, non-reversible name for this checkout: a hash of its real path. */
export function checkoutFingerprint(repoRoot) {
  let root = repoRoot;
  try {
    root = realpathSync(repoRoot);
  } catch {
    // An unreadable root still gets a stable name.
  }
  return createHash("sha256").update(root).digest("hex").slice(0, 16);
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
 * The stamp a server answered with, or null when it answered with something
 * else: a site with no stamp serves its 404 page, or its index under Vite's
 * single-page fallback, never JSON.
 */
export function parseStamp(text) {
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && typeof value.checkout === "string" ? value : null;
  } catch {
    return null;
  }
}

const short = (head) => (typeof head === "string" ? head.slice(0, 7) : "unknown");

/**
 * Why a served stamp is not acceptable, or null. The checkout and the site
 * are never negotiable; `allowStale` skips only the inputs rule.
 */
export function verifyBuildId(served, expected, { allowStale = false } = {}) {
  if (!served || typeof served !== "object") {
    return "no build stamp: the server serves a build from before this check, or another project.";
  }
  if (served.checkout !== expected.checkout) {
    return "the server serves another checkout. Stop it and run again; if this checkout was moved, rebuild.";
  }
  if (served.site !== expected.site) {
    return `the server serves the ${String(served.site)} build, not ${expected.site}.`;
  }
  if (served.inputs !== expected.inputs) {
    if (allowStale) return null;
    const commit =
      served.head !== expected.head
        ? ` (built at ${short(served.head)}, HEAD is ${short(expected.head)})`
        : "";
    return `a source of this site changed after the served build${commit}. Rebuild; a cached build needs \`pnpm exec turbo run build --force\`. DS_E2E_ALLOW_STALE=1 runs anyway, knowingly.`;
  }
  return null;
}

/** Astro integration. */
export function buildIdIntegration(site, repoRoot) {
  return {
    name: "build-id",
    hooks: {
      "astro:build:done": ({ dir }) => writeBuildId(site, fileURLToPath(dir), repoRoot),
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
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      writeBuildId(site, outDir, repoRoot);
    },
  };
}
