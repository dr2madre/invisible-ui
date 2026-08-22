#!/usr/bin/env node
// Fail when the docs site would load something from another server.
//
// The visual suite screenshots live demos: a remote image, font, stylesheet
// or media file makes the baseline depend on someone else's server being up
// and serving the same bytes. Only loading contexts count: a link in prose or
// on an `<a>` navigates when clicked, it does not paint anything.
//
//   node scripts/check-demo-determinism.mjs
//
// A justified exception goes in ALLOWED below, with its reason.
//
// This reads the sources. The visual run also watches the network live and
// fails on any request that leaves the machine, which covers URLs no text
// scan can see (built at runtime, or assembled from pieces).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCANNED = resolve(root, "packages/docs/src");

// file -> { substring, reason }. Empty today; every entry needs a review.
const ALLOWED = new Map();

// A URL with a scheme, or a protocol-relative one (`//host/path`), which
// resolves to https on the published site.
const REMOTE = String.raw`(?:https?:)?//[^\s"'\`)>]+`;

// Every way a page can be told to fetch something and paint it.
const LOADERS = [
  { what: "url()", pattern: new RegExp(String.raw`url\(\s*['"]?(${REMOTE})`, "g") },
  { what: "@import", pattern: new RegExp(String.raw`@import\s+(?:url\()?\s*['"](${REMOTE})`, "g") },
  {
    what: "loading attribute",
    pattern: new RegExp(
      String.raw`\b(?:src|srcset|poster|data|xlink:href)\s*=\s*['"\`{]?[^'"\`]*?(${REMOTE})`,
      "g",
    ),
  },
  {
    what: "href that loads",
    pattern: new RegExp(
      String.raw`<\s*(?:link|use|image|feImage)\b[^>]*?\bhref\s*=\s*['"](${REMOTE})`,
      "gs",
    ),
  },
  {
    what: "fetch or new URL",
    pattern: new RegExp(String.raw`(?:fetch|new URL)\(\s*['"\`](${REMOTE})`, "g"),
  },
];

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (entry === "generated") continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(svelte|astro|mdx?|ts|js|mjs|css)$/.test(entry)) files.push(path);
  }
};
walk(SCANNED);

const failures = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file).split("\\").join("/");
  const allowed = ALLOWED.get(rel);
  for (const loader of LOADERS) {
    loader.pattern.lastIndex = 0;
    for (const match of text.matchAll(loader.pattern)) {
      const url = match[1];
      // The XML namespace is an identifier, never fetched.
      if (url.startsWith("http://www.w3.org/")) continue;
      if (allowed && url.includes(allowed.substring)) continue;
      const line = text.slice(0, match.index).split("\n").length;
      failures.push(`${rel}:${line}  ${loader.what}  ${url}`);
    }
  }
}

if (failures.length > 0) {
  console.error("The docs site would load these from another server:");
  for (const failure of [...new Set(failures)].sort()) console.error("  " + failure);
  process.exit(1);
}
console.log(
  `Demo determinism: ${files.length} docs source files, nothing loaded from the network.`,
);
