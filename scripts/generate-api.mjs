#!/usr/bin/env node
// Generate a machine-readable props API manifest per component, from the Svelte
// source (name / type / default / required) merged with curated descriptions.
//
//   node scripts/generate-api.mjs          # write manifests
//   node scripts/generate-api.mjs --check  # fail if manifests are stale
//
// Description resolution (so it's both seeded from the existing docs and stable
// afterwards): committed manifest → MDX table (while it still exists) → source
// JSDoc → "". Type / default / required always come from source, so they can't
// drift; a freshness test runs this with --check.

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const sveltePkgDir = resolve(root, "packages/svelte");
const docsComponents = resolve(root, "packages/docs/src/content/docs/components");
const outDir = resolve(root, "packages/docs/src/generated/props");

const kebab = (n) =>
  n
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

const pkg = JSON.parse(readFileSync(resolve(sveltePkgDir, "package.json"), "utf8"));
const components = Object.keys(pkg.exports)
  .map((k) => /^\.\/(.+)\.svelte$/.exec(k)?.[1])
  .filter(Boolean)
  .map((name) => ({
    name,
    slug: kebab(name),
    sveltePath: resolve(sveltePkgDir, pkg.exports[`./${name}.svelte`].svelte.slice(2)),
    mdxPath: resolve(docsComponents, `${kebab(name)}.mdx`),
  }));

// --- source parsing -------------------------------------------------------

// Split a declaration body (everything after `export let name`) into its type
// and default, tracking bracket depth so function types (`=> void`) and
// generics/unions don't confuse the `=` that marks the assignment.
function splitTypeDefault(body) {
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    // Track () [] {} only — NOT <> (an arrow `=>`'s `>` would be misread as a
    // closing bracket; TS generics never contain a top-level `=`).
    if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    else if (c === "=" && depth === 0 && body[i + 1] !== ">" && body[i - 1] !== "=") {
      return { typePart: body.slice(0, i), defaultPart: body.slice(i + 1) };
    }
  }
  return { typePart: body, defaultPart: null };
}

function inferType(def) {
  if (def == null) return "unknown";
  const d = def.trim();
  if (d === "true" || d === "false") return "boolean";
  if (/^["'`]/.test(d)) return "string";
  if (/^-?\d/.test(d)) return "number";
  if (d.startsWith("[")) return "unknown[]";
  if (d.startsWith("{")) return "object";
  return "unknown";
}

function parseSource(src) {
  // Drop the module-context <script> block so its `export let` (if any) is ignored.
  const props = [];
  // The JSDoc body uses a tempered token `(?:(?!\*\/)[\s\S])*?` so it can't span
  // across a `*/` — otherwise a comment on a preceding non-prop declaration (e.g.
  // an `interface`) would backtrack to the next documented prop and swallow an
  // undocumented prop in between (this dropped `status` from Alert/Tag/Count/Notice).
  const re =
    /(?:\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*)?export\s+let\s+([A-Za-z_$][\w$]*)\s*([^;\n]*)/g;
  let m;
  while ((m = re.exec(src))) {
    const [, jsdocRaw, name, rest] = m;
    let type = null;
    let def = null;
    let body = rest.trim();
    if (body.startsWith(":")) {
      const { typePart, defaultPart } = splitTypeDefault(body.slice(1));
      type = typePart.trim();
      def = defaultPart == null ? null : defaultPart.trim();
    } else if (body.startsWith("=")) {
      def = body.slice(1).trim();
    }
    if (!type) type = inferType(def);
    const jsdoc = jsdocRaw
      ? jsdocRaw
          .split("\n")
          .map((l) => l.replace(/^\s*\*?/, "").trim())
          .join(" ")
          .trim()
      : "";
    props.push({
      name,
      type,
      default: def,
      required: def == null,
      description: jsdoc,
    });
  }
  return props;
}

// --- MDX descriptions (seed / fallback) -----------------------------------

function parseMdx(mdx) {
  const section = /###\s+Props([^]*?)(\n###\s|\n##\s|$)/.exec(mdx);
  const out = { descriptions: {}, selected: false };
  if (!section) return out;
  out.selected = /\(selected\)/i.test(section[0].split("\n")[0]);
  for (const line of section[1].split("\n")) {
    // Split on unescaped pipes so `\|` inside union-type cells doesn't shift
    // columns; then unescape.
    const cells = line.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
    // table row: ["", prop, type, default, desc, ""]
    if (cells.length < 6) continue;
    const first = cells[1];
    const desc = cells[4];
    if (!first || first === "Prop" || /^-+$/.test(first)) continue;
    for (const t of first.matchAll(/`([^`]+)`/g)) {
      const id = t[1].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(id)) out.descriptions[id] = desc;
    }
  }
  return out;
}

// --- generate -------------------------------------------------------------

function buildManifest(c) {
  const src = readFileSync(c.sveltePath, "utf8");
  const sourceProps = parseSource(src);

  const committed = existsSync(resolve(outDir, `${c.slug}.json`))
    ? JSON.parse(readFileSync(resolve(outDir, `${c.slug}.json`), "utf8"))
    : null;
  const committedDesc = Object.fromEntries(
    (committed?.props ?? []).map((p) => [p.name, p.description]),
  );

  const mdx = existsSync(c.mdxPath) ? parseMdx(readFileSync(c.mdxPath, "utf8")) : null;

  const props = sourceProps.map((p) => ({
    name: p.name,
    type: p.type,
    default: p.default,
    required: p.required,
    description: committedDesc[p.name] || mdx?.descriptions[p.name] || p.description || "",
  }));

  return { component: c.slug, selected: mdx?.selected ?? committed?.selected ?? false, props };
}

const check = process.argv.includes("--check");
mkdirSync(outDir, { recursive: true });

let stale = [];
for (const c of components) {
  if (!existsSync(c.sveltePath)) continue;
  const manifest = buildManifest(c);
  const json = JSON.stringify(manifest, null, 2) + "\n";
  const outPath = resolve(outDir, `${c.slug}.json`);
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
  if (current !== json) {
    if (check) stale.push(c.slug);
    else writeFileSync(outPath, json);
  }
}

// Prune manifests for components that no longer exist.
const valid = new Set(components.map((c) => `${c.slug}.json`));
for (const file of existsSync(outDir) ? readdirSync(outDir) : []) {
  if (file.endsWith(".json") && !valid.has(file)) {
    if (check) stale.push(file);
  }
}

if (check && stale.length) {
  console.error(`Stale API manifests (run \`pnpm api:generate\`):\n  ${stale.join("\n  ")}`);
  process.exit(1);
}
console.log(`${check ? "Checked" : "Generated"} ${components.length} API manifests.`);
