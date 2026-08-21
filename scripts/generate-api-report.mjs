#!/usr/bin/env node
// Generate a deterministic report of each package's public TypeScript API,
// read from the built declarations, never from the workspace sources.
//
//   node scripts/generate-api-report.mjs          # write the reports
//   node scripts/generate-api-report.mjs --check  # fail if they are stale
//
// One report per package (packages/docs/src/generated/api/<pkg>.json):
//
//   {
//     "package": "@design-system/core",
//     "entry": "core/dist/index.d.ts",
//     "exportMap": { ... },                  // the package.json exports field
//     "externalReferences": [...],           // import specifiers in the d.ts
//     "symbols": [ { "name", "kind", "signature" }, ... ]   // sorted by name
//   }
//
// The signature is the declaration text with whitespace collapsed, so any
// change to a public type or value shows up as a reviewable diff of this file.
// Namespaces (the core's per-component machines) are walked one level deep,
// as `namespace.member`. Build the packages before running this.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(root, "packages/docs/src/generated/api");

const PACKAGES = [
  { dir: "core", entry: "core/dist/index.d.ts" },
  { dir: "packages/svelte", entry: "packages/svelte/dist/index.d.ts" },
  { dir: "packages/vue", entry: "packages/vue/dist/index.d.ts" },
  { dir: "packages/react", entry: "packages/react/dist/index.d.ts" },
  { dir: "packages/elements", entry: "packages/elements/dist/index.d.ts" },
];

// Rollup disambiguates same-named private types with $-suffixes whose numbers
// shuffle when unrelated code moves. Strip them, so a report diff means a real
// API change and not a bundling reshuffle.
const squeeze = (text) =>
  text
    .replace(/\$[a-zA-Z0-9]+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

function kindOf(symbol) {
  const flags = symbol.getFlags();
  if (flags & ts.SymbolFlags.Function) return "function";
  if (flags & ts.SymbolFlags.Class) return "class";
  if (flags & ts.SymbolFlags.Interface) return "interface";
  if (flags & ts.SymbolFlags.TypeAlias) return "type";
  if (flags & ts.SymbolFlags.Enum) return "enum";
  if (flags & ts.SymbolFlags.Module) return "namespace";
  if (flags & ts.SymbolFlags.Variable) return "const";
  return "other";
}

/** Every declaration a symbol has, as one collapsed, deterministic string. */
function signatureOf(symbol) {
  const parts = (symbol.getDeclarations() ?? []).map((declaration) => {
    // A namespace body would repeat every member; its members are reported
    // one by one instead, so the namespace itself reports only its header.
    if (ts.isModuleDeclaration(declaration)) return `namespace ${symbol.getName()}`;
    return squeeze(declaration.getText());
  });
  return parts.sort().join(" | ");
}

function reportPackage({ dir, entry }) {
  const entryPath = resolve(root, entry);
  if (!existsSync(entryPath)) {
    throw new Error(`${entry} does not exist. Build the packages first.`);
  }
  const program = ts.createProgram([entryPath], { skipLibCheck: true });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryPath);
  const moduleSymbol = checker.getSymbolAtLocation(source);

  const symbols = [];
  const record = (name, symbol) => {
    const target =
      symbol.getFlags() & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    symbols.push({ name, kind: kindOf(target), signature: signatureOf(target) });
    // Walk one level into a namespace: those members are the real API.
    if (target.getFlags() & ts.SymbolFlags.Module) {
      for (const member of checker.getExportsOfModule(target)) {
        const memberTarget =
          member.getFlags() & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(member) : member;
        symbols.push({
          name: `${name}.${member.getName()}`,
          kind: kindOf(memberTarget),
          signature: signatureOf(memberTarget),
        });
      }
    }
  };
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    record(symbol.getName(), symbol);
  }
  symbols.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  // Import specifiers the public declarations reach for. Anything that is not
  // a documented dependency is an internal module leaking into the contract.
  const externals = new Set();
  for (const statement of source.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      externals.add(statement.moduleSpecifier.text);
    }
  }

  const manifest = JSON.parse(readFileSync(resolve(root, dir, "package.json"), "utf8"));
  return {
    package: manifest.name,
    entry,
    exportMap: manifest.exports ?? {},
    externalReferences: [...externals].sort(),
    symbols,
  };
}

const reports = PACKAGES.map(reportPackage);

let stale = false;
mkdirSync(OUT_DIR, { recursive: true });
for (const report of reports) {
  const file = resolve(OUT_DIR, `${report.package.split("/").pop()}.json`);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    const current = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (current !== serialized) {
      console.error(`Stale API report for ${report.package} (run \`pnpm api:report\`).`);
      stale = true;
    }
  } else {
    writeFileSync(file, serialized);
  }
  console.log(`${report.package}: ${report.symbols.length} public symbols`);
}
if (stale) process.exit(1);
