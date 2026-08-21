#!/usr/bin/env node
// The declarations promise values; the runtime must deliver exactly them.
// For every package this imports the built entry in plain Node ESM and
// compares its runtime export names against the API report's value-kind
// symbols, in both directions: a type-only export that claims to be a value,
// or a runtime export the declarations hide, fails here. Build first, and run
// `pnpm api:report` first, so the comparison is against the current report.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PACKAGES = [
  { report: "core", entry: "core/dist/index.js" },
  { report: "svelte", entry: "packages/svelte/dist/index.js" },
  { report: "vue", entry: "packages/vue/dist/index.js" },
  { report: "react", entry: "packages/react/dist/index.js" },
  { report: "elements", entry: "packages/elements/dist/index.js" },
];

// Kinds that exist at runtime. Namespaces do: `export * as ns` ships an object.
const VALUE_KINDS = new Set(["function", "const", "class", "enum", "namespace"]);

let failed = false;
for (const { report, entry } of PACKAGES) {
  const reportPath = resolve(root, `packages/docs/src/generated/api/${report}.json`);
  const data = JSON.parse(readFileSync(reportPath, "utf8"));
  const declared = new Set(
    data.symbols
      .filter((symbol) => !symbol.name.includes(".") && VALUE_KINDS.has(symbol.kind))
      .map((symbol) => symbol.name),
  );

  const module = await import(pathToFileURL(resolve(root, entry)).href);
  const runtime = new Set(Object.keys(module).filter((name) => name !== "default"));

  const missing = [...declared].filter((name) => !runtime.has(name));
  const undeclared = [...runtime].filter((name) => !declared.has(name));
  if (missing.length || undeclared.length) {
    failed = true;
    for (const name of missing) {
      console.error(`${data.package}: ${name} is declared as a value but missing at runtime`);
    }
    for (const name of undeclared) {
      console.error(`${data.package}: ${name} exists at runtime but the declarations hide it`);
    }
  } else {
    console.log(`${data.package}: runtime and declared values match (${runtime.size})`);
  }
}
if (failed) process.exit(1);
