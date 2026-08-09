// tsup emits the unbundled dist with the extensionless relative specifiers
// the TypeScript sources use ("./types", "./button"). Bundlers resolve them,
// Node ESM does not: it requires a full file path. Rewrite every relative
// specifier in dist to the file it resolves to ("./types.js",
// "./button/index.js"), so the built package works in Node without changing
// the source modules or the tree-shakeable output shape.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");

function* jsFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* jsFiles(path);
    else if (entry.name.endsWith(".js")) yield path;
  }
}

const SPECIFIER = /(\b(?:from|import)\s*["'])(\.\.?\/[^"']+)(["'])/g;

let patched = 0;
for (const file of jsFiles(dist)) {
  const source = readFileSync(file, "utf8");
  const next = source.replace(SPECIFIER, (match, head, spec, tail) => {
    if (spec.endsWith(".js")) return match;
    const base = dirname(file);
    if (existsSync(resolve(base, `${spec}.js`))) return `${head}${spec}.js${tail}`;
    if (existsSync(resolve(base, spec, "index.js"))) return `${head}${spec}/index.js${tail}`;
    throw new Error(`unresolved specifier "${spec}" in ${file}`);
  });
  if (next !== source) {
    writeFileSync(file, next);
    patched += 1;
  }
}

console.log(`Patched ESM specifiers in ${patched} dist files.`);
