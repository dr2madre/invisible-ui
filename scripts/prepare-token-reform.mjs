// Audit the migration against its pinned baseline. The active source must not
// be overwritten when this historical check runs.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import { tokenEntries, setToken, MODES, cssName, validateTokenModel } from "./token-model.mjs";
import { families, newTokenPath, oldCssName } from "./token-migration-map.mjs";

export const BASELINE = "21f1b047";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const atBaseline = (path) =>
  execFileSync("git", ["show", `${BASELINE}:${path}`], { cwd: root, encoding: "utf8" });

export function extractPalette(source) {
  const start = source.indexOf("  const hues = [");
  const end = source.indexOf("\n  ];", start);
  if (start < 0 || end < 0) throw new Error("Palette table not found");
  const table = source.slice(start, end);
  const result = [];
  for (const match of table.matchAll(/key: "([a-z]+)",\s*name: "([^"]+)",\s*hex: \{([^}]+)\}/g)) {
    const [, key, name, body] = match;
    if (!families[key]) throw new Error(`Unknown palette family: ${key}`);
    const values = Object.fromEntries(
      [...body.matchAll(/(\d+): "(#[A-Fa-f0-9]{6})"/g)].map(([, step, hex]) => [
        step,
        hex.toLowerCase(),
      ]),
    );
    if (Object.keys(values).join() !== "50,100,200,300,400,500,600,700,800,900,950")
      throw new Error(`Incomplete palette: ${name}`);
    result.push({ key: families[key], name, values });
  }
  if (result.length !== 12) throw new Error("Expected twelve palette families");
  return result;
}

export function prepareReform(source, paletteSource) {
  const entries = tokenEntries(source);
  const paths = new Map(entries.map(([path]) => [path, newTokenPath(path)]));
  const rewrite = (value) => {
    if (typeof value === "string")
      return value.replace(/\{([^{}]+)\}/g, (_, old) => {
        if (!paths.has(old)) throw new Error(`Unknown reference: ${old}`);
        return `{${paths.get(old)}}`;
      });
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === "object")
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v)]));
    return value;
  };
  const tree = {
    $extensions: {
      "com.invisible-ui.schema": { version: 2, defaultMode: "light", modes: ["light", "dark"] },
    },
  };
  const leaves = new Map();
  const manifest = [];
  for (const [old, token] of entries) {
    const path = paths.get(old);
    const mode = /^(role|component)\.(light|dark)\./.exec(old)?.[2] ?? null;
    const mapped = rewrite(token);
    if (mode === "dark") {
      const light = leaves.get(path);
      if (!light) throw new Error(`Missing Light base for ${path}`);
      light.$extensions = {
        ...light.$extensions,
        [MODES]: {
          dark: {
            $value: mapped.$value,
            ...(mapped.$extensions ? { $extensions: mapped.$extensions } : {}),
          },
        },
      };
    } else {
      if (leaves.has(path)) throw new Error(`Conflicting migration: ${path}`);
      leaves.set(path, mapped);
    }
    manifest.push({
      from: old,
      to: path,
      mode,
      type: token.$type,
      cssBefore: oldCssName(old),
      cssAfter: cssName(path),
      before: token,
      after: mapped,
    });
  }
  const palette = extractPalette(paletteSource);
  for (const family of palette)
    for (const [step, value] of Object.entries(family.values)) {
      const path = `colors.palette.${family.key}.${step}`;
      const existing = leaves.get(path);
      if (existing && existing.$value.toLowerCase() !== value)
        throw new Error(`Palette differs from existing value: ${path}`);
      if (!existing)
        leaves.set(path, {
          $type: "color",
          $value: value,
          $description: `${family.name} ${step}.`,
        });
    }
  for (const [path, token] of leaves) setToken(tree, path, token);
  validateTokenModel(tree);
  return { tree, manifest, palette };
}

export async function prepareFiles({ check = true } = {}) {
  if (!check) throw new Error("The migration is active; regeneration is disabled");
  const source = JSON.parse(atBaseline("packages/tokens/tokens.json"));
  const prepared = prepareReform(
    source,
    atBaseline("packages/docs/src/demos/ColorPaletteDemo.svelte"),
  );
  const files = {
    "packages/tokens/migration-v2.json": {
      baseline: BASELINE,
      status: "active",
      paletteSource: "packages/docs/src/demos/ColorPaletteDemo.svelte",
      entries: prepared.manifest,
    },
  };
  for (const [path, data] of Object.entries(files)) {
    const content = await format(JSON.stringify(data), { parser: "json", printWidth: 96 });
    if (check) {
      const active = JSON.parse(readFileSync(resolve(root, path), "utf8"));
      const baseline = JSON.parse(content);
      active.entries = active.entries.filter((entry) => !entry.retired);
      baseline.entries = baseline.entries.filter(
        (entry) => !entry.to.startsWith("components.general.container."),
      );
      if (JSON.stringify(active) !== JSON.stringify(baseline))
        throw new Error(`Stale reform artifact: ${path}`);
    }
  }
  return prepared;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await prepareFiles();
