#!/usr/bin/env node
// The two elements entries follow opposite rules, and a build must keep both:
// the package entry leaves its dependencies to the consumer's bundler, and
// `define.js` inlines them so a script tag needs no import map. When the two
// were built as one, the core was inlined into a chunk the entries shared, and
// importing one element pulled every primitive (see ADR 0008).
//
//   node scripts/check-elements-dist.mjs          # the real dist
//
// Exports `checkElementsDist(root)`, which returns null when the dist holds
// both rules and a message naming the drift otherwise.

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Dependencies the package entry must import, and `define.js` must not. */
export const EXTERNALS = ["@design-system/core", "@floating-ui/dom"];

const IMPORT_LINE =
  /^(?:import|export)\b[^\n]*?\bfrom\s+["']([^"']+)["']|^import\s+["']([^"']+)["']/gm;

/** Bare specifiers the file imports from, in source order. */
export function importedSpecifiers(source) {
  const found = [];
  for (const match of source.matchAll(IMPORT_LINE)) {
    const specifier = match[1] ?? match[2];
    if (specifier && !specifier.startsWith(".") && !specifier.startsWith("/")) {
      found.push(specifier);
    }
  }
  return found;
}

export function checkElementsDist(root) {
  const dist = resolve(root, "packages/elements/dist");
  const entry = resolve(dist, "index.js");
  const define = resolve(dist, "define.js");
  for (const file of [entry, define]) {
    if (!existsSync(file)) {
      return `[elements-dist] ${file} is missing: run pnpm --filter @design-system/elements build.`;
    }
  }

  const entryImports = new Set(importedSpecifiers(readFileSync(entry, "utf8")));
  const missing = EXTERNALS.filter((name) => !entryImports.has(name));
  if (missing.length) {
    return (
      `[elements-dist] dist/index.js inlines ${missing.join(" and ")}: the package entry must ` +
      `import them so a consumer's bundler can tree-shake the core (packages/elements/tsup.config.ts).`
    );
  }

  const defineImports = importedSpecifiers(readFileSync(define, "utf8"));
  if (defineImports.length) {
    return (
      `[elements-dist] dist/define.js imports ${defineImports.join(", ")}: the script-tag entry ` +
      `must be self-contained (packages/elements/tsup.config.ts).`
    );
  }
  return null;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const problem = checkElementsDist(root);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  console.log("elements dist: the package entry keeps its externals, define.js is self-contained.");
}
