// Verify the built core package as a consumer sees it: pack the package, let
// npm install the tarball into a temporary project, then import the entry in
// plain Node ESM and type-check against the published declarations. Uses the
// package output only, never the workspace sources. Run `pnpm build` first.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

const consumer = mkdtempSync(join(tmpdir(), "core-smoke-"));
let tarball = "";
try {
  // pnpm pack prints the tarball path as its last output line.
  const packOutput = run("corepack", ["pnpm", "pack", "--pack-destination", consumer], packageRoot);
  tarball = packOutput.trim().split("\n").at(-1);

  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ name: "core-smoke-consumer", private: true, type: "module" }, null, 2),
  );
  // The cache lives inside the throwaway consumer, so the run never depends on
  // (or writes to) the machine's shared npm cache. The package has no runtime
  // dependencies, so nothing is fetched.
  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--cache",
      join(consumer, ".npm-cache"),
      tarball,
    ],
    consumer,
  );

  // Runtime: the entry resolves and behaves in supported Node ESM.
  writeFileSync(
    join(consumer, "main.mjs"),
    [
      'import { asyncContent, calendar, label, popover } from "@design-system/core";',
      "const state = popover.initialState({});",
      'if (state.open !== false || !state.id) throw new Error("unexpected popover state");',
      'if (typeof label.connect !== "function") throw new Error("label.connect missing");',
      'if (typeof calendar.initialState !== "function") throw new Error("calendar missing");',
      'const view = asyncContent.deriveAsyncView({ status: "loading", hasContent: true });',
      'if (view !== "refreshing") throw new Error("unexpected async view");',
      'console.log("runtime import ok");',
    ].join("\n"),
  );
  run(process.execPath, [join(consumer, "main.mjs")], consumer);

  // Types: TypeScript resolves the declarations through the package exports.
  writeFileSync(
    join(consumer, "main.ts"),
    [
      'import { asyncContent, popover } from "@design-system/core";',
      "const state: popover.PopoverState = popover.initialState({ open: true });",
      'if (!state.open) throw new Error("unreachable");',
      "const view: asyncContent.AsyncView = asyncContent.deriveAsyncView({",
      '  status: "success",',
      "  hasContent: false,",
      "  isEmpty: true,",
      "});",
      'if (view !== "empty") throw new Error("unreachable");',
    ].join("\n"),
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "nodenext",
          moduleResolution: "nodenext",
          strict: true,
          noEmit: true,
        },
        files: ["main.ts"],
      },
      null,
      2,
    ),
  );
  const require = createRequire(import.meta.url);
  const tsc = resolve(dirname(require.resolve("typescript/package.json")), "bin/tsc");
  run(process.execPath, [tsc, "-p", consumer], consumer);

  console.log("Packed core package: runtime import and type resolution ok.");
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
