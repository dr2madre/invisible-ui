#!/usr/bin/env node
// Fail when a docs demo depends on the network for what it renders.
//
// The visual suite screenshots live demos: a remote image, font or media
// file makes the baseline depend on someone else's server being up and
// serving the same bytes. Links (`href`) are navigation, not rendering,
// so they stay allowed.
//
//   node scripts/check-demo-determinism.mjs
//
// A justified exception goes in ALLOWED below, with its reason.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEMOS = resolve(root, "packages/docs/src/demos");

// file -> substring -> reason. Empty today; every entry needs a review.
const ALLOWED = new Map();

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(svelte|astro|ts|js|css)$/.test(entry)) files.push(path);
  }
};
walk(DEMOS);

const failures = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    const match = /https?:\/\/[^\s"'`)]+/.exec(line);
    if (!match) return;
    // The XML namespace is an identifier, never fetched.
    if (match[0].startsWith("http://www.w3.org/")) return;
    // A link navigates; it does not load into the page.
    if (/href\s*[=:]/.test(line)) return;
    const rel = relative(root, file);
    const allowed = ALLOWED.get(rel);
    if (allowed && line.includes(allowed.substring)) return;
    failures.push(`${rel}:${index + 1}  ${line.trim()}`);
  });
}

if (failures.length > 0) {
  console.error("Remote resources in docs demos (use a repository-owned asset):");
  for (const failure of failures) console.error("  " + failure);
  process.exit(1);
}
console.log(`Demo determinism: ${files.length} demo files, no remote resources.`);
