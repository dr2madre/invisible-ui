// Every package as a consumer receives it. Packs all five, installs the
// tarballs together into one throwaway project outside the workspace, and
// checks what a consumer can actually reach: every advertised entry point
// resolves and is not empty, the barrel imports in plain Node ESM (what a
// server-side render does), the side-effect entry is safe where there is no
// DOM, and the tarball carries no test scaffolding.
//
// The per-package `smoke` scripts go deeper on one package each (SSR compile,
// declaration type-checking). This one goes wide, and is the only check that
// covers React and Elements.
//
// Run `pnpm build` first: it packs what `dist` holds.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { specifiersOf, withoutQuery } from "./specifiers.mjs";
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The packages a consumer installs, and where they live. */
const PACKAGES = [
  { name: "@design-system/core", dir: "core" },
  { name: "@design-system/svelte", dir: "packages/svelte" },
  { name: "@design-system/vue", dir: "packages/vue" },
  { name: "@design-system/react", dir: "packages/react" },
  { name: "@design-system/elements", dir: "packages/elements" },
];

/**
 * The peers a consumer installs alongside, pinned: a floating range would let
 * somebody else's release change what a required check does. `@types/react` is
 * here because React ships no types of its own and the declarations are read.
 */
const PEERS = [
  "svelte@5.56.4",
  "vue@3.5.40",
  "react@19.2.8",
  "react-dom@19.2.8",
  "@types/react@19.2.18",
];

// One line per problem, not one per file that shows it.
const failures = new Set();
const fail = (message) => failures.add(message);

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

/** Every file the tarball carries, as absolute paths. */
const filesUnder = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

/** The files whose imports are worth reading: code and stylesheets. */
const READABLE = /\.(js|mjs|cjs|ts|tsx|jsx|svelte|vue|css)$/;

/** What a relative specifier can resolve to inside a package. */
const CANDIDATES = ["", ".js", ".mjs", ".ts", ".svelte", ".css", "/index.js", "/index.ts"];

/** The package a specifier belongs to: `@scope/name` or `name`. */
const packageOf = (specifier) =>
  specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];

const consumer = mkdtempSync(join(tmpdir(), "packed-consumers-"));
try {
  // The tarball path is the last line of the pack output.
  const tarballs = PACKAGES.map(({ dir }) =>
    run("corepack", ["pnpm", "pack", "--pack-destination", consumer], join(repoRoot, dir))
      .trim()
      .split("\n")
      .at(-1),
  );

  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ name: "packed-consumers", private: true, type: "module" }, null, 2),
  );
  // The cache lives inside the throwaway project, so the run never depends on
  // (or writes to) the machine's shared npm cache.
  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--cache",
      join(consumer, ".npm-cache"),
      ...tarballs,
      ...PEERS,
    ],
    consumer,
  );

  // Nothing may be a link back into the workspace: a consumer has no workspace.
  for (const { name } of PACKAGES) {
    const installed = join(consumer, "node_modules", name);
    if (lstatSync(installed).isSymbolicLink()) fail(`${name} was linked, not installed`);
    if (realpathSync(installed).startsWith(repoRoot)) {
      fail(`${name} resolves back into the workspace`);
    }
  }

  // Every entry the package advertises, and every file those entries lead to.
  const typeEntries = [];
  const jsEntries = [];
  for (const { name } of PACKAGES) {
    const dir = join(consumer, "node_modules", name);
    const json = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const targets = new Set();
    const walk = (value) => {
      if (typeof value === "string") targets.add(value);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(json.exports);
    for (const field of ["main", "module", "types"]) if (json[field]) targets.add(json[field]);
    if (targets.size === 0) fail(`${name} advertises no entry point at all`);
    for (const target of targets) {
      const path = join(dir, target);
      let stat;
      try {
        stat = statSync(path);
      } catch {
        fail(`${name} promises ${target}, and the tarball does not carry it`);
        continue;
      }
      // A directory has a size too, so `size > 0` alone would pass one.
      if (!stat.isFile()) fail(`${name} points ${target} at something that is not a file`);
      else if (stat.size === 0) fail(`${name} ships ${target} empty`);
      else if (target.endsWith(".d.ts")) typeEntries.push([name, target]);
      else if (/\.(js|mjs)$/.test(target)) jsEntries.push([name, target]);
    }

    const declared = new Set([
      name,
      ...Object.keys(json.dependencies ?? {}),
      ...Object.keys(json.peerDependencies ?? {}),
      ...Object.keys(json.optionalDependencies ?? {}),
    ]);
    for (const file of filesUnder(dir).filter((path) => READABLE.test(path))) {
      const { specifiers, computed } = specifiersOf(readFileSync(file, "utf8"));
      const where = file.replace(`${dir}/`, "");
      if (computed > 0 && !where.startsWith("dist/")) {
        fail(`${name} imports something this check cannot name, in ${where}`);
      }
      for (const raw of specifiers) {
        const specifier = withoutQuery(raw);
        if (specifier.startsWith("#") || specifier.startsWith("node:")) continue;
        if (specifier.startsWith(".")) {
          // A shipped file that imports a file the tarball left behind is the
          // whole class of packaging bug, and the most common one.
          const from = dirname(file);
          const found = CANDIDATES.some((suffix) => {
            try {
              return statSync(resolve(from, specifier + suffix)).isFile();
            } catch {
              return false;
            }
          });
          if (!found) fail(`${name} ships ${where}, which imports a missing ${specifier}`);
          continue;
        }
        // Everything imported by name must be declared, or the consumer's
        // install does not bring it. Checked against the manifest rather than
        // by resolving: a package hoisted for a sibling would answer a
        // dependency this one forgot to declare.
        if (!declared.has(packageOf(specifier))) {
          fail(`${name} imports ${specifier} in ${where}, and declares no ${packageOf(specifier)}`);
        }
      }
    }
  }

  // A component that is shipped but does not compile is an entry point that
  // resolves and still cannot be used. The consumer has the Svelte compiler,
  // because the package asks for it as a peer.
  const componentProbe = [
    'import { compile } from "svelte/compiler";',
    'import { readFileSync, readdirSync, statSync } from "node:fs";',
    'import { join } from "node:path";',
    'const root = "node_modules/@design-system/svelte/src/lib";',
    "const walk = (d) => readdirSync(d).flatMap((e) => {",
    "  const p = join(d, e);",
    '  return statSync(p).isDirectory() ? walk(p) : p.endsWith(".svelte") ? [p] : [];',
    "});",
    "const broken = [];",
    "const files = walk(root);",
    "for (const file of files) {",
    "  try {",
    '    compile(readFileSync(file, "utf8"), { filename: file, generate: "server" });',
    "  } catch (error) {",
    "    broken.push(`${file}: ${error.message}`);",
    "  }",
    "}",
    "console.log(JSON.stringify({ compiled: files.length, broken }));",
  ].join("\n");
  writeFileSync(join(consumer, "components.mjs"), componentProbe);
  try {
    const result = JSON.parse(
      run(process.execPath, [join(consumer, "components.mjs")], consumer).trim(),
    );
    for (const broken of result.broken.slice(0, 3)) {
      fail(`@design-system/svelte ships a component that does not compile: ${broken}`);
    }
    if (result.compiled < 50) {
      fail(`only ${result.compiled} components were compiled: the sweep found almost nothing`);
    }
    console.log(`Shipped components compiled: ${result.compiled}`);
  } catch {
    fail("the shipped Svelte components could not be compiled at all");
  }

  // A declaration file the consumer's TypeScript cannot read is an entry point
  // that resolves and still does not work.
  writeFileSync(
    join(consumer, "types.ts"),
    typeEntries.map(([name], index) => `import * as p${index} from "${name}";`).join("\n") +
      `\nexport const seen = [${typeEntries.map((_, i) => `p${i}`).join(", ")}].length;\n`,
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        module: "nodenext",
        moduleResolution: "nodenext",
        target: "es2022",
        strict: true,
        noEmit: true,
        // The packages' own declarations are what is under test; their
        // dependencies' are not.
        skipLibCheck: false,
        types: [],
      },
      files: ["types.ts"],
    }),
  );
  try {
    const require = createRequire(import.meta.url);
    const tsc = resolve(dirname(require.resolve("typescript/package.json")), "bin/tsc");
    execFileSync(process.execPath, [tsc, "-p", consumer], { cwd: consumer, stdio: "pipe" });
  } catch (error) {
    const output = String(error.stdout ?? error.message)
      .split("\n")
      .filter((line) => line.includes("node_modules/@design-system/"))
      .slice(0, 5);
    fail(`the shipped declarations do not type-check:\n      ${output.join("\n      ")}`);
  }

  // Test scaffolding is not part of the product. Matched on the path inside
  // the package: an absolute one carries whatever the temporary directory is
  // called, and would call every file scaffolding if that name looked like it.
  const SCAFFOLDING =
    /(^|\/)(__tests__|__mocks__|test|tests|fixtures)\/|\.(test|spec|stories|bench|fixture)\.|(^|\/)(vitest|playwright|jest)[.-]|(^|\/)(mock|test)-/;
  for (const { name } of PACKAGES) {
    const dir = join(consumer, "node_modules", name);
    const shipped = filesUnder(dir).map((file) => file.replace(`${dir}/`, ""));
    const scaffolding = shipped.filter((file) => SCAFFOLDING.test(file));
    if (scaffolding.length > 0) {
      fail(`${name} ships test scaffolding: ${scaffolding.slice(0, 3).join(", ")}`);
    }
  }

  // The runtime a server-side render sees: plain Node ESM, no DOM.
  const probe = [
    "const report = {};",
    "for (const name of " + JSON.stringify(PACKAGES.map((p) => p.name)) + ") {",
    "  const module = await import(name);",
    "  report[name] = Object.keys(module).length;",
    "  if (report[name] === 0) throw new Error(`${name} exports nothing at runtime`);",
    "}",
    "// A side-effect entry must not need a DOM to be imported: an SSR pass",
    "// imports it before any element exists.",
    'await import("@design-system/elements/define");',
    'if (typeof globalThis.customElements !== "undefined") throw new Error("the probe had a DOM after all");',
    "console.log(JSON.stringify(report));",
  ].join("\n");
  writeFileSync(join(consumer, "probe.mjs"), probe);
  try {
    const counts = JSON.parse(
      run(process.execPath, [join(consumer, "probe.mjs")], consumer).trim(),
    );
    for (const [name, count] of Object.entries(counts)) {
      if (count < 5) fail(`${name} exports suspiciously few names at runtime: ${count}`);
    }
    console.log(
      "Runtime exports per package: " +
        Object.entries(counts)
          .map(([name, count]) => `${name.replace("@design-system/", "")} ${count}`)
          .join(", "),
    );
  } catch {
    // A stack trace here would bury the findings above, which usually say why.
    fail("the packages do not import in plain Node ESM; run `pnpm build` first if dist is stale");
  }
} finally {
  rmSync(consumer, { recursive: true, force: true });
}

if (failures.size > 0) {
  console.error("\nThe packed packages are not what a consumer needs:\n");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`Packed consumers: ${PACKAGES.length} packages reachable end to end.`);
