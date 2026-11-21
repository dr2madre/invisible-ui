// The install instructions readers follow name the packages this repository
// publishes, and none of those pages still calls them private or unpublished.
// Both were wrong after 0.1.0-alpha.1 reached npm.
//
//   node --test scripts/

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (rel) => readFileSync(join(root, rel), "utf8");

const packageDirs = ["core", ...readdirSync(join(root, "packages")).map((d) => `packages/${d}`)];
const published = packageDirs
  .filter((dir) => existsSync(join(root, dir, "package.json")))
  .map((dir) => ({ dir, manifest: JSON.parse(read(`${dir}/package.json`)) }))
  .filter(({ manifest }) => !manifest.private && manifest.publishConfig?.access === "public");

function docsPages(dir) {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return docsPages(rel);
    return /\.mdx?$/.test(entry.name) ? [rel] : [];
  });
}

const adoptionPages = [
  "README.md",
  "docs/api-stability.md",
  "docs/technical-roadmap.md",
  "docs/adapters-roadmap.md",
  "docs/releasing.md",
  ...packageDirs.map((dir) => `${dir}/README.md`).filter((rel) => existsSync(join(root, rel))),
  ...docsPages("packages/docs/src/content/docs"),
];

test("the published packages are the five npm packages", () => {
  assert.deepEqual(published.map(({ manifest }) => manifest.name).sort(), [
    "@nozcadesign/invisible-ui-core",
    "@nozcadesign/invisible-ui-elements",
    "@nozcadesign/invisible-ui-react",
    "@nozcadesign/invisible-ui-svelte",
    "@nozcadesign/invisible-ui-vue",
  ]);
});

test("each published package is installed by its own name and the alpha tag", () => {
  const pages = ["README.md", "packages/docs/src/content/docs/frameworks.mdx"];
  for (const { dir, manifest } of published) {
    const command = `pnpm add ${manifest.name}@alpha`;
    for (const page of [...pages, `${dir}/README.md`]) {
      assert.ok(read(page).includes(command), `${page} lacks \`${command}\``);
    }
  }
});

test("no adoption page calls the packages private or unpublished", () => {
  const stale = /private\s*\/\s*unpublished|`private: true`|\bunpublished\b|publishes no packages/i;
  const found = adoptionPages.flatMap((page) =>
    read(page)
      .split("\n")
      .map((line, i) => ({ line, at: `${page}:${i + 1}` }))
      .filter(({ line }) => stale.test(line))
      .map(({ at, line }) => `${at}: ${line.trim()}`),
  );
  assert.deepEqual(found, []);
});

// No Svelte component imports tokens.css, so an app that follows a page saying
// the file is needed only outside the components gets unstyled components.
test("no adoption page says Svelte needs tokens.css only outside its components", () => {
  const componentImports = readdirSync(join(root, "packages/svelte/src/lib"), {
    recursive: true,
  })
    .filter((rel) => rel.endsWith(".svelte"))
    .filter((rel) => read(`packages/svelte/src/lib/${rel}`).includes("tokens.css"));
  assert.deepEqual(componentImports, [], "a Svelte component now imports tokens.css");
  // packages/svelte/README.md is corrected and checked from the packed package
  // by scripts/check-packed-consumers.mjs in its own change.
  const stale = /outside\s+(them|component-scoped)/i;
  const found = adoptionPages
    .filter((page) => page !== "packages/svelte/README.md")
    .filter((page) => stale.test(read(page)));
  assert.deepEqual(found, []);
});
