#!/usr/bin/env node
// Generate a machine-readable API manifest per component, with one entry for
// every adapter that ships it: Svelte, Vue, React and the web components.
//
//   node scripts/generate-api.mjs          # write manifests
//   node scripts/generate-api.mjs --check  # fail if manifests are stale
//
// Shape (packages/docs/src/generated/props/<component>.json):
//
//   {
//     "component": "checkbox",
//     "selected": false,
//     "frameworks": {
//       "svelte":   { "import": {...}, "props": [...] },
//       "vue":      { "import": {...}, "props": [...], "emits": [...], "slots": [...] },
//       "react":    { "import": {...}, "props": [...], "extends": [...] },
//       "elements": { "import": {...}, "attributes": [...], "notes": [...] }
//     }
//   }
//
// Description resolution (so it is both seeded from the existing docs and
// stable afterwards): committed manifest → MDX table (while it still exists,
// Svelte only) → source JSDoc → "". Types, defaults and required flags always
// come from source, so they cannot drift; a freshness test runs this with
// --check.

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const sveltePkgDir = resolve(root, "packages/svelte");
const vuePkgDir = resolve(root, "packages/vue");
const reactPkgDir = resolve(root, "packages/react");
const elementsPkgDir = resolve(root, "packages/elements");
const docsComponents = resolve(root, "packages/docs/src/content/docs/components");
const outDir = resolve(root, "packages/docs/src/generated/props");

const kebab = (n) =>
  n
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

const collapse = (s) => s.replace(/\s+/g, " ").trim();

// --- source scanning ------------------------------------------------------

// Index of the character closing the string that starts at `i`.
function stringEnd(text, i) {
  const quote = text[i];
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === "\\") j++;
    else if (text[j] === quote) return j;
  }
  return text.length - 1;
}

// Visit every character of `text` from `from` that is real code (strings and
// comments are skipped). `visit(index, char, depth)` receives the nesting depth
// after the character is applied; return false from it to stop the walk.
// Depth counts (), [], {} and TS generics, so `Record<string, string>` and
// `(row, key) => unknown` both read as one unit.
function eachCodeChar(text, from, visit) {
  let depth = 0;
  let angle = 0;
  let prev = "";
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === "/" && next === "/") {
      const nl = text.indexOf("\n", i);
      if (nl < 0) return;
      i = nl;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end < 0 ? text.length : end + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      i = stringEnd(text, i);
      prev = c;
      continue;
    }
    if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    // A `<` opens a generic only when it follows an identifier and is glued to
    // the type name; `a < b` and `a <= b` keep their distance.
    else if (c === "<" && /[\w$>\]]/.test(prev) && next !== "=" && next !== " ") angle++;
    else if (c === ">" && angle > 0 && prev !== "=") angle--;
    if (!/\s/.test(c)) prev = c;
    if (visit(i, c, depth + angle) === false) return;
  }
}

// Index of the `}` (or `)`, `]`) matching the bracket at `start`.
function blockEnd(text, start) {
  let end = text.length;
  eachCodeChar(text, start, (i, c, depth) => {
    if (depth === 0 && ")]}".includes(c)) {
      end = i;
      return false;
    }
  });
  return end;
}

// Split a block body on a separator at depth zero.
function splitTop(body, sep = ",") {
  const parts = [];
  let last = 0;
  eachCodeChar(body, 0, (i, c, depth) => {
    if (depth === 0 && c === sep) {
      parts.push(body.slice(last, i));
      last = i + 1;
    }
  });
  parts.push(body.slice(last));
  return parts.filter((p) => p.trim());
}

// A JSDoc body without its comment markers, on one line.
const cleanDoc = (raw) =>
  collapse(
    (raw || "")
      .split("\n")
      .map((l) => l.replace(/^\s*\*?/, "").trim())
      .join(" "),
  );

// Peel the comments off the head of a chunk, keeping the last JSDoc.
function takeLeadingDoc(text) {
  let doc = "";
  let rest = text.replace(/^\s+/, "");
  for (;;) {
    if (rest.startsWith("/**")) {
      const end = rest.indexOf("*/");
      doc = rest.slice(3, end < 0 ? rest.length : end);
      rest = rest.slice(end < 0 ? rest.length : end + 2).replace(/^\s+/, "");
    } else if (rest.startsWith("/*")) {
      const end = rest.indexOf("*/");
      rest = rest.slice(end < 0 ? rest.length : end + 2).replace(/^\s+/, "");
    } else if (rest.startsWith("//")) {
      const nl = rest.indexOf("\n");
      rest = nl < 0 ? "" : rest.slice(nl + 1).replace(/^\s+/, "");
    } else break;
  }
  return { doc: cleanDoc(doc), rest };
}

// --- Svelte ---------------------------------------------------------------

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

function parseSvelte(src) {
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
    const body = rest.trim();
    if (body.startsWith(":")) {
      const { typePart, defaultPart } = splitTypeDefault(body.slice(1));
      type = typePart.trim();
      def = defaultPart == null ? null : defaultPart.trim();
    } else if (body.startsWith("=")) {
      def = body.slice(1).trim();
    }
    if (!type) type = inferType(def);
    props.push({
      name,
      type,
      default: def,
      required: def == null,
      description: cleanDoc(jsdocRaw),
    });
  }
  return props;
}

// --- TypeScript interfaces (Vue prop docs, React props) -------------------

function parseInterface(src, name) {
  const re = new RegExp(`export\\s+interface\\s+${name}\\b([^{]*)\\{`);
  const head = re.exec(src);
  if (!head) return null;
  const open = src.indexOf("{", head.index + head[0].length - 1);
  const body = src.slice(open + 1, blockEnd(src, open));
  const heritage = /extends\s+([\s\S]+)$/.exec(head[1]);
  const members = [];
  for (const chunk of splitTop(body, ";")) {
    const { doc, rest } = takeLeadingDoc(chunk);
    const m = /^(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/.exec(rest.trim());
    if (!m) continue;
    members.push({
      name: m[1],
      type: collapse(m[3]),
      required: !m[2],
      description: doc,
    });
  }
  return {
    extends: heritage ? collapse(heritage[1]).split(/\s*,\s*/) : [],
    members,
  };
}

// --- Vue ------------------------------------------------------------------

const VUE_CONSTRUCTORS = {
  String: "string",
  Number: "number",
  Boolean: "boolean",
  Array: "unknown[]",
  Object: "object",
  Function: "function",
  Date: "Date",
  Symbol: "symbol",
};

// `[Boolean, String] as PropType<CheckedState>` → `CheckedState`,
// `Object as PropType<Record<string, string>>` → `Record<string, string>`,
// `[String, Number]` → `string | number`, `String` → `string`.
function vueType(raw) {
  const text = collapse(raw);
  const asType = /\bPropType<([\s\S]*)>\s*$/.exec(text);
  if (asType) return collapse(asType[1]);
  if (text.startsWith("[")) {
    const inner = text.slice(1, blockEnd(text, 0));
    const parts = splitTop(inner).map((p) => VUE_CONSTRUCTORS[p.trim()] ?? p.trim());
    return parts.join(" | ");
  }
  return VUE_CONSTRUCTORS[text] ?? text;
}

// The option entries of the file's `defineComponent({ ... })` call.
function defineComponentOptions(src) {
  const at = src.indexOf("defineComponent(");
  if (at < 0) return {};
  const open = src.indexOf("{", at);
  if (open < 0) return {};
  const body = src.slice(open + 1, blockEnd(src, open));
  const options = {};
  for (const chunk of splitTop(body)) {
    const { rest } = takeLeadingDoc(chunk);
    const m = /^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/.exec(rest.trim());
    if (m) options[m[1]] = m[2].trim();
  }
  return options;
}

function vuePropDescriptor(text) {
  const out = { type: "unknown", default: null, required: false };
  if (!text.startsWith("{")) {
    out.type = vueType(text);
    return out;
  }
  for (const part of splitTop(text.slice(1, blockEnd(text, 0)))) {
    const m = /^\s*([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/.exec(part);
    if (!m) continue;
    const value = collapse(m[2]);
    if (m[1] === "type") out.type = vueType(value);
    else if (m[1] === "default") out.default = value;
    else if (m[1] === "required") out.required = value === "true";
  }
  return out;
}

function parseVue(src, name) {
  const options = defineComponentOptions(src);
  const propsDoc = new Map(
    (parseInterface(src, `${name}Props`)?.members ?? []).map((m) => [m.name, m.description]),
  );

  const props = [];
  if (options.props?.startsWith("{")) {
    const body = options.props.slice(1, blockEnd(options.props, 0));
    for (const chunk of splitTop(body)) {
      const { doc, rest } = takeLeadingDoc(chunk);
      const m = /^([A-Za-z_$][\w$]*|"[^"]+")\s*:\s*([\s\S]+)$/.exec(rest.trim());
      if (!m) continue;
      const propName = m[1].replace(/"/g, "");
      const descriptor = vuePropDescriptor(m[2].trim());
      props.push({
        name: propName,
        type: descriptor.type,
        default: descriptor.default,
        required: descriptor.required,
        description: doc || propsDoc.get(propName) || "",
      });
    }
  }

  const emits = [];
  if (options.emits?.startsWith("{")) {
    const body = options.emits.slice(1, blockEnd(options.emits, 0));
    for (const chunk of splitTop(body)) {
      const { rest } = takeLeadingDoc(chunk);
      const m = /^([A-Za-z_$][\w$:]*|"[^"]+")\s*:\s*([\s\S]+)$/.exec(rest.trim());
      if (!m) continue;
      // The validator's parameter list is the event payload.
      const payload = /^\s*\(([\s\S]*?)\)\s*=>/.exec(m[2]);
      emits.push({
        name: m[1].replace(/"/g, ""),
        payload: payload ? collapse(payload[1]) : "",
      });
    }
  }

  // Slot names are read from the `slots.<name>` calls in the render function.
  // Only static access is used, and the adapter has no dynamic `slots[...]`,
  // so the list is complete for every component that has slots.
  const slots = [...new Set([...src.matchAll(/\bslots\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))];
  slots.sort();

  return { props, emits, slots };
}

// --- React ----------------------------------------------------------------

// Defaults live in the component's parameter destructuring, not in the props
// interface: `function Checkbox({ checked = false, ... }: CheckboxProps)`.
function reactDefaults(src, name) {
  const start = new RegExp(`function\\s+${name}\\s*\\(`).exec(src);
  const defaults = {};
  if (!start) return defaults;
  const open = src.indexOf("{", start.index + start[0].length - 1);
  if (open < 0) return defaults;
  for (const chunk of splitTop(src.slice(open + 1, blockEnd(src, open)))) {
    const m = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(chunk);
    if (m) defaults[m[1]] = collapse(m[2]);
  }
  return defaults;
}

function parseReact(src, name) {
  const iface = parseInterface(src, `${name}Props`);
  if (!iface) return null;
  const defaults = reactDefaults(src, name);
  return {
    extends: iface.extends,
    props: iface.members.map((m) => ({
      name: m.name,
      type: m.type,
      default: defaults[m.name] ?? null,
      required: m.required,
      description: m.description,
    })),
  };
}

// --- Web components -------------------------------------------------------

// Split a prose list on the commas that separate its items, leaving the ones
// inside a parenthetical note alone.
function splitProse(text) {
  const items = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      items.push(text.slice(last, i));
      last = i + 1;
    }
  }
  items.push(text.slice(last));
  return items.map((s) => s.trim()).filter(Boolean);
}

// Pull the `Attributes:` / `Properties:` / `Emits:` paragraphs out of the JSDoc
// header. Each runs from its marker to the line that ends the sentence.
function docSections(doc) {
  const lines = doc.split("\n").map((l) => l.replace(/^\s*\*?/, "").trim());
  const sections = {};
  for (let i = 0; i < lines.length; i++) {
    const marker = /^(Attributes|Properties|Emits|Events):\s*(.*)$/.exec(lines[i]);
    if (!marker) continue;
    const collected = [marker[2]];
    while (!/\.$/.test(collected[collected.length - 1]) && i + 1 < lines.length) {
      const next = lines[++i];
      if (!next || /^(Attributes|Properties|Emits|Events):/.test(next)) break;
      collected.push(next);
    }
    sections[marker[1].toLowerCase()] = collapse(collected.join(" "));
  }
  return sections;
}

function parseElement(src, className) {
  const decl = new RegExp(`export\\s+class\\s+${className}\\b`).exec(src);
  if (!decl) return null;
  const before = src.slice(0, decl.index);
  const close = before.lastIndexOf("*/");
  const open = close < 0 ? -1 : before.lastIndexOf("/**", close);
  const doc = open < 0 ? "" : before.slice(open + 3, close);
  const sections = docSections(doc);

  const observedMatch = /static\s+observedAttributes\s*=\s*\[([^\]]*)\]/.exec(src);
  const observed = new Set(
    observedMatch ? splitTop(observedMatch[1]).map((s) => s.trim().replace(/["']/g, "")) : [],
  );

  const attributes = [];
  for (const item of splitProse(sections.attributes ?? "")) {
    const m = /^`([^`]+)`\s*(?:\((.*)\))?\.?$/.exec(item.replace(/\.$/, ""));
    if (!m) continue;
    const note = (m[2] ?? "").trim();
    attributes.push({
      name: m[1],
      reactive: observed.has(m[1]),
      required: /^required\b/.test(note),
      description: note.replace(/^required\s*[—-]?\s*/, ""),
    });
  }

  const notes = [];
  for (const key of ["properties", "emits", "events"]) {
    if (sections[key]) notes.push(`${key[0].toUpperCase()}${key.slice(1)}: ${sections[key]}`);
  }

  return { attributes, notes };
}

// --- component inventory --------------------------------------------------

// Map an adapter's public component names to their source files, from the
// package's own index: names and folders don't always match (TableSet lives in
// table/, LocaleProvider in i18n/).
function exportMap(indexPath) {
  const src = readFileSync(indexPath, "utf8");
  const map = new Map();
  for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from\s*"(\.[^"]*)"/g)) {
    for (const raw of m[1].split(",")) {
      const item = raw.trim();
      if (!item || item.startsWith("type ")) continue;
      map.set(item, m[2]);
    }
  }
  return map;
}

const sveltePkg = JSON.parse(readFileSync(resolve(sveltePkgDir, "package.json"), "utf8"));
const vueExports = exportMap(resolve(vuePkgDir, "src/index.ts"));
const reactExports = exportMap(resolve(reactPkgDir, "src/index.ts"));
const elementExports = exportMap(resolve(elementsPkgDir, "src/index.ts"));

// The `ds-*` tag of every element, from the side-effect entry point.
const elementTags = new Map(
  [
    ...readFileSync(resolve(elementsPkgDir, "src/define.ts"), "utf8").matchAll(
      /define\("([\w-]+)",\s*([A-Za-z_$][\w$]*)\)/g,
    ),
  ].map((m) => [m[2], m[1]]),
);

const components = Object.keys(sveltePkg.exports)
  .map((k) => /^\.\/(.+)\.svelte$/.exec(k)?.[1])
  .filter(Boolean)
  .map((name) => ({
    name,
    slug: kebab(name),
    sveltePath: resolve(sveltePkgDir, sveltePkg.exports[`./${name}.svelte`].svelte.slice(2)),
    mdxPath: resolve(docsComponents, `${kebab(name)}.mdx`),
  }));

// --- MDX descriptions (seed / fallback, Svelte only) ----------------------

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

// Curated descriptions survive regeneration: they are read back from the
// committed manifest, per framework, before the source JSDoc is consulted.
function committedDescriptions(committed, framework, key = "props") {
  const rows = committed?.frameworks?.[framework]?.[key] ?? [];
  return Object.fromEntries(rows.map((row) => [row.name, row.description]));
}

function buildManifest(c) {
  const committedPath = resolve(outDir, `${c.slug}.json`);
  const committed = existsSync(committedPath)
    ? JSON.parse(readFileSync(committedPath, "utf8"))
    : null;
  const mdx = existsSync(c.mdxPath) ? parseMdx(readFileSync(c.mdxPath, "utf8")) : null;
  const frameworks = {};

  // Svelte
  const svelteDesc = committedDescriptions(committed, "svelte");
  frameworks.svelte = {
    import: {
      kind: "default",
      name: c.name,
      specifier: `@design-system/svelte/${c.name}.svelte`,
    },
    props: parseSvelte(readFileSync(c.sveltePath, "utf8")).map((p) => ({
      ...p,
      description: svelteDesc[p.name] || mdx?.descriptions[p.name] || p.description || "",
    })),
  };

  // Vue
  const vueModule = vueExports.get(c.name);
  if (vueModule) {
    const src = readFileSync(resolve(vuePkgDir, "src", `${vueModule.slice(2)}.ts`), "utf8");
    const parsed = parseVue(src, c.name);
    const vueDesc = committedDescriptions(committed, "vue");
    frameworks.vue = {
      import: { kind: "named", name: c.name, specifier: "@design-system/vue" },
      props: parsed.props.map((p) => ({
        ...p,
        description: vueDesc[p.name] || p.description || "",
      })),
      emits: parsed.emits,
      slots: parsed.slots,
    };
  }

  // React
  const reactModule = reactExports.get(c.name);
  if (reactModule) {
    const file = resolve(reactPkgDir, "src", `${reactModule.slice(2)}.tsx`);
    const parsed = existsSync(file) ? parseReact(readFileSync(file, "utf8"), c.name) : null;
    if (parsed) {
      const reactDesc = committedDescriptions(committed, "react");
      frameworks.react = {
        import: { kind: "named", name: c.name, specifier: "@design-system/react" },
        extends: parsed.extends,
        props: parsed.props.map((p) => ({
          ...p,
          description: reactDesc[p.name] || p.description || "",
        })),
      };
    }
  }

  // Web components
  const className = `Ds${c.name}`;
  const elementModule = elementExports.get(className);
  if (elementModule && elementTags.has(className)) {
    const src = readFileSync(
      resolve(elementsPkgDir, "src", `${elementModule.slice(2)}.ts`),
      "utf8",
    );
    const parsed = parseElement(src, className);
    if (parsed) {
      const elementDesc = committedDescriptions(committed, "elements", "attributes");
      frameworks.elements = {
        import: {
          kind: "element",
          name: elementTags.get(className),
          specifier: "@design-system/elements/define",
        },
        attributes: parsed.attributes.map((a) => ({
          ...a,
          description: elementDesc[a.name] || a.description || "",
        })),
        notes: parsed.notes,
      };
    }
  }

  return {
    component: c.slug,
    selected: mdx?.selected ?? committed?.selected ?? false,
    frameworks,
  };
}

const check = process.argv.includes("--check");
mkdirSync(outDir, { recursive: true });

const stale = [];
for (const c of components) {
  if (!existsSync(c.sveltePath)) continue;
  const json = JSON.stringify(buildManifest(c), null, 2) + "\n";
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
