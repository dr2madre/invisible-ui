#!/usr/bin/env node
// Fail on the local set-ups that make the gate lie.
//
//   node scripts/check-env.mjs
//
// Each rule records something that went wrong once; the message says what to
// do. Nothing here moves or deletes a file: the remedy is the reader's.
// CI runs it too, so a rule never rots unnoticed.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

/** @returns {string[]} problems found under `root`, each with its remedy */
export function checkEnvironment(root, { isAlive = alive } = {}) {
  const problems = [];

  // A pnpm shim inside the root node_modules/.bin makes Turbo spawn
  // `./node_modules/.bin/pnpm` relative to each package's directory, where it
  // does not exist: every non-root task fails with "unable to spawn child
  // process". Shims belong in a directory on PATH
  // (`corepack enable --install-directory <dir>`).
  for (const shim of ["pnpm", "pnpx"]) {
    if (existsSync(resolve(root, "node_modules/.bin", shim))) {
      problems.push(
        `node_modules/.bin/${shim} exists. Remove it; Turbo then runs the ${shim} found on PATH.`,
      );
    }
  }

  // `astro preview` run by an agent turns into a background daemon that
  // outlives the shell and keeps answering on :4321 for another checkout's
  // tests. Astro records it in `.astro/preview.json`; a live pid there means
  // one is still running.
  const lock = resolve(root, "packages/docs/.astro/preview.json");
  if (existsSync(lock)) {
    let pid;
    try {
      pid = JSON.parse(readFileSync(lock, "utf8")).pid;
    } catch {
      pid = undefined;
    }
    if (pid && isAlive(pid)) {
      problems.push(
        `a background astro preview (pid ${pid}) is running from packages/docs. Stop it: pnpm --filter @design-system/docs exec astro preview stop. If that finds nothing, the pid was reused: delete packages/docs/.astro/preview.json.`,
      );
    }
  }

  return problems;
}

// A pid this user may not signal belongs to someone else's process, never to
// a preview this user started: Astro reads it the same way.
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const problems = checkEnvironment(resolve(fileURLToPath(new URL("..", import.meta.url))));
  if (problems.length) {
    console.error("Environment problems:\n  " + problems.join("\n  "));
    process.exit(1);
  }
  console.log("Environment ok.");
}
