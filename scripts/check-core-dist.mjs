#!/usr/bin/env node
// Fail when `core/dist` was not built from the current `core/src`: the
// adapters test the built core (see CONTRIBUTING, "Running the checks
// locally"), and Turbo rebuilds it only for the tasks that go through Turbo.
//
//   node scripts/check-core-dist.mjs            # exit 1 with the remedy
//   DS_ALLOW_STALE_CORE=1 <any suite>           # run anyway, with a warning
//
// Each adapter's vitest config runs the same check as a `globalSetup`.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { hashPackageSources } from "./source-hash.mjs";

export const REBUILD = "pnpm --filter @design-system/core build";

/**
 * @param {string} root repository root
 * @returns {string | null} the problem, or null when dist matches the sources
 */
export function checkCoreDist(root) {
  const coreDir = resolve(root, "core");
  const info = resolve(coreDir, "dist/.build-info.json");
  if (!existsSync(resolve(coreDir, "dist/index.js"))) {
    return `core/dist is missing: run \`${REBUILD}\`.`;
  }
  if (!existsSync(info)) {
    return `core/dist carries no build info, so it predates this guard: run \`${REBUILD}\`.`;
  }
  let built;
  try {
    built = JSON.parse(readFileSync(info, "utf8")).sourceHash;
  } catch {
    return `core/dist/.build-info.json is unreadable: run \`${REBUILD}\`.`;
  }
  let current;
  try {
    current = hashPackageSources(root, "core");
  } catch (error) {
    return `core sources could not be read (${error.message}): run \`${REBUILD}\`.`;
  }
  if (built !== current) {
    return `core/dist was built from other sources than the current core/src: run \`${REBUILD}\`.`;
  }
  return null;
}

/** Throws unless dist is current or the escape hatch is set. */
export function assertCoreDist(root) {
  const problem = checkCoreDist(root);
  if (!problem) return;
  if (process.env.DS_ALLOW_STALE_CORE === "1") {
    console.warn(
      `[core-dist] ${problem}\n[core-dist] DS_ALLOW_STALE_CORE is set: running against a stale core anyway.`,
    );
    return;
  }
  throw new Error(`[core-dist] ${problem}`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const problem = checkCoreDist(root);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  console.log("core/dist matches core/src.");
}
