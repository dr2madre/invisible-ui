// The docs site and the examples are the project's own consumers. They resolve
// the packages through the workspace, so an import that only works because the
// source happens to be next door would pass their build and fail everybody
// else's. This checks every `@design-system/*` specifier they use against the
// target package's own `exports` map: what a consumer cannot import, the docs
// and the examples must not import either.
import { specifiersOf, withoutQuery } from "./specifiers.mjs";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The consumers, and the package directories they may import from. */
const CONSUMERS = ["packages/docs/src", "examples"];
const PACKAGE_DIRS = {
  "@design-system/core": "core",
  "@design-system/svelte": "packages/svelte",
  "@design-system/vue": "packages/vue",
  "@design-system/react": "packages/react",
  "@design-system/elements": "packages/elements",
};

// Stylesheets and prose count: the docs site imports a package's tokens from
// CSS, and the import lines in the reference pages are what readers copy.
const SOURCE = /\.(ts|tsx|js|mjs|cjs|jsx|svelte|vue|astro|mdx|md|css|html)$/;
const SKIP = new Set(["node_modules", "dist", ".astro", ".turbo"]);

const files = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    if (SKIP.has(entry)) return [];
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? files(path) : SOURCE.test(entry) ? [path] : [];
  });

/** Every specifier the package's exports map answers, `.` written as the bare name. */
const entryPoints = (name) => {
  const json = JSON.parse(readFileSync(join(repoRoot, PACKAGE_DIRS[name], "package.json"), "utf8"));
  return new Set(
    Object.keys(json.exports ?? { ".": true }).map((key) =>
      key === "." ? name : `${name}/${key.replace(/^\.\//, "")}`,
    ),
  );
};

const known = Object.fromEntries(
  Object.keys(PACKAGE_DIRS).map((name) => [name, entryPoints(name)]),
);
const failures = [];

/** Every `@design-system/*` specifier a consumer file names. */
const ours = (text) =>
  specifiersOf(text)
    .specifiers.map(withoutQuery)
    .filter((specifier) => specifier.startsWith("@design-system/"));

const seen = new Set();
for (const root of CONSUMERS) {
  for (const file of files(join(repoRoot, root))) {
    for (const specifier of ours(readFileSync(file, "utf8"))) {
      const name = specifier.split("/").slice(0, 2).join("/");
      if (!(name in known)) continue;
      seen.add(specifier);
      if (!known[name].has(specifier)) {
        failures.push(
          `${file.replace(`${repoRoot}/`, "")} imports ${specifier}, which ${name} does not export`,
        );
      }
    }
  }
}

if (seen.size === 0) failures.push("no package import found at all: nothing was checked");

if (failures.length > 0) {
  console.error("\nThe project's own consumers reach past the package boundary:\n");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`Consumer imports: ${seen.size} distinct entry points, all of them exported.`);
