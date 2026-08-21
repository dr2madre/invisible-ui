// Verify the built Svelte package as a consumer sees it: pack core and this
// package, let npm install the two tarballs (plus the svelte peer) into a
// temporary project, import the barrel in plain Node ESM, compile a shipped
// component subpath for the server the way SvelteKit SSR would, and type-check
// against the published declarations. Uses the package output only, never the
// workspace sources. Run `pnpm build` first.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreRoot = resolve(packageRoot, "../../core");
const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

const consumer = mkdtempSync(join(tmpdir(), "svelte-smoke-"));
try {
  // pnpm pack prints the tarball path as its last output line. The core
  // tarball comes too: the adapter depends on it and nothing is published.
  const pack = (root) =>
    run("corepack", ["pnpm", "pack", "--pack-destination", consumer], root)
      .trim()
      .split("\n")
      .at(-1);
  const coreTarball = pack(coreRoot);
  const svelteTarball = pack(packageRoot);

  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ name: "svelte-smoke-consumer", private: true, type: "module" }, null, 2),
  );
  // The cache lives inside the throwaway consumer, so the run never depends on
  // (or writes to) the machine's shared npm cache. The peer and the floating
  // dependency come from the registry.
  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--cache",
      join(consumer, ".npm-cache"),
      coreTarball,
      svelteTarball,
      "svelte@^5.0.0",
    ],
    consumer,
  );

  // Runtime: the barrel resolves and behaves in supported Node ESM, and a
  // shipped component subpath compiles for the server.
  writeFileSync(
    join(consumer, "main.mjs"),
    [
      'import * as ds from "@design-system/svelte";',
      'import { createPopover, createTable, normalizeProps } from "@design-system/svelte";',
      'import { compile } from "svelte/compiler";',
      'import { readFileSync } from "node:fs";',
      'import { createRequire } from "node:module";',
      "",
      'if (typeof createPopover !== "function") throw new Error("createPopover missing");',
      'if (typeof createTable !== "function") throw new Error("createTable missing");',
      'const props = normalizeProps({ "aria-expanded": false });',
      'if (props["aria-expanded"] !== false) throw new Error("normalizeProps broke props");',
      "const runtimeExports = Object.keys(ds).length;",
      "if (runtimeExports < 40) throw new Error(`suspiciously few runtime exports: ${runtimeExports}`);",
      "",
      "// A subpath component ships as source: it must resolve through the",
      "// export map and compile for SSR with the consumer's own Svelte.",
      "const require = createRequire(import.meta.url);",
      'const componentPath = require.resolve("@design-system/svelte/TextField.svelte");',
      'const source = readFileSync(componentPath, "utf8");',
      'const compiled = compile(source, { generate: "server", filename: "TextField.svelte" });',
      'if (!compiled.js.code.length) throw new Error("empty SSR compile output");',
      'console.log("runtime import + SSR compile ok:", runtimeExports, "exports");',
    ].join("\n"),
  );
  run(process.execPath, [join(consumer, "main.mjs")], consumer);

  // Types: TypeScript resolves the declarations through the package exports.
  writeFileSync(
    join(consumer, "main.ts"),
    [
      'import { createCheckbox, type CheckboxContext, type CheckboxApi } from "@design-system/svelte";',
      "const context: CheckboxContext = { checked: true, disabled: false };",
      'if (typeof createCheckbox !== "function" || !context) throw new Error("unreachable");',
      "type Api = CheckboxApi;",
      "const witness: Api | null = null;",
      "void witness;",
    ].join("\n"),
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "nodenext",
          moduleResolution: "nodenext",
          target: "es2022",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        files: ["main.ts"],
      },
      null,
      2,
    ),
  );
  const require = createRequire(import.meta.url);
  const tsc = resolve(dirname(require.resolve("typescript/package.json")), "bin/tsc");
  execFileSync(process.execPath, [tsc, "-p", consumer], {
    cwd: consumer,
    encoding: "utf8",
    // tsc reports errors on stdout: show them instead of swallowing them.
    stdio: ["ignore", "inherit", "inherit"],
  });

  console.log("Packed svelte package: runtime import, SSR compile and type resolution ok.");
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
