import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkElementsDist, importedSpecifiers, EXTERNALS } from "./check-elements-dist.mjs";

const ENTRY_OK = `// src/button/ds-button.ts
import { button as core } from "@design-system/core";
import { computePosition } from "@floating-ui/dom";
var DsButton = class extends HTMLElement {};
export { DsButton };
`;
const DEFINE_OK = `var identityNormalize = (props) => props;
var DsButton = class extends HTMLElement {};
customElements.define("ds-button", DsButton);
`;

function fixture({ entry = ENTRY_OK, define = DEFINE_OK } = {}) {
  const root = mkdtempSync(join(tmpdir(), "elements-dist-"));
  const dist = join(root, "packages/elements/dist");
  mkdirSync(dist, { recursive: true });
  if (entry !== null) writeFileSync(join(dist, "index.js"), entry);
  if (define !== null) writeFileSync(join(dist, "define.js"), define);
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("the two externals are the declared dependencies", () => {
  assert.deepEqual(EXTERNALS, ["@design-system/core", "@floating-ui/dom"]);
});

test("importedSpecifiers reads bare specifiers only", () => {
  const source = [
    'import { a } from "@design-system/core";',
    "import './styles.css';",
    'import "@floating-ui/dom";',
    'export { b } from "./chunk-ABC.js";',
    'export * from "/absolute/path.js";',
    'const s = "from \\"not-an-import\\"";',
  ].join("\n");
  assert.deepEqual(importedSpecifiers(source), ["@design-system/core", "@floating-ui/dom"]);
});

test("a dist that holds both rules passes", () => {
  const f = fixture();
  assert.equal(checkElementsDist(f.root), null);
  f.done();
});

test("a package entry that inlines the core is refused, naming the dependency", () => {
  const f = fixture({
    entry: `import { computePosition } from "@floating-ui/dom";\nvar identityNormalize = (p) => p;\n`,
  });
  assert.match(checkElementsDist(f.root), /index\.js inlines @design-system\/core/);
  f.done();
});

test("a package entry that inlines Floating UI is refused too", () => {
  const f = fixture({ entry: `import { button } from "@design-system/core";\n` });
  assert.match(checkElementsDist(f.root), /inlines @floating-ui\/dom/);
  f.done();
});

test("a define.js that imports anything is refused: a script tag has no import map", () => {
  const f = fixture({ define: `import { button } from "@design-system/core";\n` });
  assert.match(checkElementsDist(f.root), /define\.js imports @design-system\/core/);
  f.done();
});

test("a missing entry is reported with the build command, not a stack", () => {
  const f = fixture({ define: null });
  assert.match(checkElementsDist(f.root), /define\.js is missing.*elements build/);
  f.done();
});

test("the real elements dist, when built, passes the guard", () => {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  if (!existsSync(join(repo, "packages/elements/dist/define.js"))) return;
  assert.equal(checkElementsDist(repo), null);
});
