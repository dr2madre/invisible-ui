import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  EXCEPTIONS,
  PARITY_DIR,
  WORKFLOW,
  covers,
  parseChecklist,
  parseExceptions,
  uncoveredPaths,
  workflowPaths,
} from "./check-parity-drift.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("a checklist names its reference commit and paths", () => {
  const text = [
    "# Button parity checklist",
    "",
    "Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`",
    "",
    "Reference paths: `core/src/button` `packages/svelte/src/lib/button`",
  ].join("\n");
  assert.deepEqual(parseChecklist(text), {
    commit: "31edd44ea7637357a2eac288bcc050e07f52852f",
    paths: ["core/src/button", "packages/svelte/src/lib/button"],
  });
});

test("a checklist without the lines yields nothing to compare", () => {
  assert.deepEqual(parseChecklist("# Empty\n"), { commit: "", paths: [] });
});

test("an exception needs a checklist and a reason", () => {
  assert.deepEqual(parseExceptions("[]"), { entries: [], problems: [] });
  const ok = parseExceptions(
    '[{ "checklist": "tabs.md", "reason": "reviewed in the next release" }]',
  );
  assert.deepEqual(ok.entries, [{ checklist: "tabs.md", reason: "reviewed in the next release" }]);
  assert.equal(parseExceptions('[{ "checklist": "tabs.md", "reason": " " }]').problems.length, 1);
  assert.equal(parseExceptions('{"tabs.md": "x"}').problems.length, 1);
  assert.equal(parseExceptions("not json").problems.length, 1);
});

test("a directory filter covers the directory and what is inside it", () => {
  assert.ok(covers("core/src/button/**", "core/src/button"));
  assert.ok(covers("core/src/i18n/**", "core/src/i18n/locale.ts"));
  assert.ok(!covers("core/src/button/**", "core/src/button-group"));
  assert.ok(covers("docs/time-field.md", "docs/time-field.md"));
  assert.deepEqual(uncoveredPaths(["core/src/tabs/**"], ["core/src/tabs", "core/src/menu"]), [
    "core/src/menu",
  ]);
});

test("the Flutter workflow runs on every checklist's reference paths", () => {
  const filters = workflowPaths(readFileSync(resolve(root, WORKFLOW), "utf8"));
  assert.equal(filters.length, 2, "a pull_request and a push filter");
  const dir = resolve(root, PARITY_DIR);
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
    const { commit, paths } = parseChecklist(readFileSync(resolve(dir, name), "utf8"));
    assert.ok(commit && paths.length > 0, `${name} names a reference commit and paths`);
    for (const filter of filters) {
      assert.deepEqual(uncoveredPaths(filter, paths), [], `${name}: paths the workflow misses`);
    }
  }
});

test("the exception list is valid, and every entry has a reason", () => {
  const { problems } = parseExceptions(readFileSync(resolve(root, EXCEPTIONS), "utf8"));
  assert.deepEqual(problems, []);
});
