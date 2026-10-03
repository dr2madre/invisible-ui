#!/usr/bin/env node
// Fail when the committed Dart tokens differ from what
// packages/tokens/tokens.json produces today. It renders the `dart` platform
// of the token build in memory and compares; `pnpm tokens:build` writes it.
//
//   node scripts/check-flutter-tokens.mjs

import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";

import config from "../packages/svelte/style-dictionary.config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "packages/flutter/lib/src/tokens/tokens.g.dart");

// The config's paths are relative to packages/svelte; these are absolute.
const sd = new StyleDictionary({
  ...config,
  source: [resolve(root, "packages/tokens/tokens.json")],
  platforms: { dart: { ...config.platforms.dart, buildPath: `${dirname(output)}/` } },
  log: { verbosity: "silent" },
});
const [file] = await sd.formatPlatform("dart");

let committed = "";
try {
  committed = readFileSync(output, "utf8");
} catch {
  // A missing file is stale too.
}
const name = relative(root, output);
if (committed !== file.output) {
  console.error(`${name} is stale: run "pnpm tokens:build" and commit the result.`);
  process.exit(1);
}
console.log(`${name} matches packages/tokens/tokens.json.`);
