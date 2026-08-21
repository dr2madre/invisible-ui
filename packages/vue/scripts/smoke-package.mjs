// Verify the built Vue package as a consumer sees it: pack core and this
// package, let npm install the two tarballs (plus the vue peer) into a
// temporary project, import the entry in plain Node ESM the way SSR does, and
// type-check against the published declarations. Uses the package output only,
// never the workspace sources. Run `pnpm build` first.
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

const consumer = mkdtempSync(join(tmpdir(), "vue-smoke-"));
try {
  // pnpm pack prints the tarball path as its last output line. The core
  // tarball comes too: the adapter depends on it and nothing is published.
  const pack = (root) =>
    run("corepack", ["pnpm", "pack", "--pack-destination", consumer], root)
      .trim()
      .split("\n")
      .at(-1);
  const coreTarball = pack(coreRoot);
  const vueTarball = pack(packageRoot);

  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ name: "vue-smoke-consumer", private: true, type: "module" }, null, 2),
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
      vueTarball,
      "vue@^3.4.0",
    ],
    consumer,
  );

  // Runtime: the entry resolves and behaves in supported Node ESM, which is
  // exactly what a server-side render does with it.
  writeFileSync(
    join(consumer, "main.mjs"),
    [
      'import * as ds from "@design-system/vue";',
      'import { normalizeProps, useButton, Button } from "@design-system/vue";',
      'if (typeof useButton !== "function") throw new Error("useButton missing");',
      'if (!Button) throw new Error("Button component missing");',
      'const props = normalizeProps({ "aria-label": "x", onClick: () => {} });',
      'if (props["aria-label"] !== "x") throw new Error("normalizeProps broke props");',
      "const runtimeExports = Object.keys(ds).length;",
      "if (runtimeExports < 100) throw new Error(`suspiciously few runtime exports: ${runtimeExports}`);",
      'console.log("runtime import ok:", runtimeExports, "exports");',
    ].join("\n"),
  );
  run(process.execPath, [join(consumer, "main.mjs")], consumer);

  // Types: TypeScript resolves the declarations through the package exports.
  writeFileSync(
    join(consumer, "main.ts"),
    [
      'import { useCheckbox, type UseCheckboxOptions, type CheckboxProps } from "@design-system/vue";',
      'import type { CheckedState } from "@design-system/vue";',
      "const options: UseCheckboxOptions = { checked: true, onCheckedChange: (value: CheckedState) => void value };",
      'if (typeof useCheckbox !== "function") throw new Error("unreachable");',
      'const props: CheckboxProps = { label: "x" };',
      'if (!props.label || !options) throw new Error("unreachable");',
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

  console.log("Packed vue package: runtime import and type resolution ok.");
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
