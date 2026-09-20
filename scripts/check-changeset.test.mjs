import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./check-changeset.mjs", import.meta.url));

// A miniature repository: one commit as the base, one as the head. The gate
// diffs the two, so it needs real git, not stubs.
function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), "changeset-"));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null" },
    });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  git("config", "commit.gpgsign", "false");
  const write = (rel, content) => {
    mkdirSync(join(dir, rel, ".."), { recursive: true });
    writeFileSync(join(dir, rel), typeof content === "string" ? content : JSON.stringify(content));
  };
  for (const [rel, content] of Object.entries(files)) write(rel, content);
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  // Later commits move HEAD; the base stays where the tag says.
  git("tag", "base");
  git("tag", "branch-point");
  return {
    dir,
    write,
    commit() {
      git("add", "-A");
      git("commit", "-q", "-m", "head");
    },
    // The base branch moves on after this one left it, which is the ordinary
    // case for any pull request that is not merged the minute it is opened.
    baseMovesOn(files) {
      git("checkout", "-q", "main");
      git("checkout", "-q", "-b", "base-moves-on", "base");
      for (const [rel, content] of Object.entries(files)) write(rel, content);
      git("add", "-A");
      git("commit", "-q", "-m", "someone else");
      git("tag", "-f", "base");
      git("checkout", "-q", "main");
    },
    run() {
      const r = spawnSync("node", [script, "base"], { cwd: dir, encoding: "utf8" });
      return { code: r.status, out: r.stdout + r.stderr };
    },
    done: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const API = "packages/docs/src/generated/api";
const PROPS = "packages/docs/src/generated/props";
const REGISTRY = "packages/docs/src/generated/tokens/registry.json";
const changeset = (pkgs, body = "Something changed.") =>
  `---\n${pkgs.map((p) => `"${p}": patch`).join("\n")}\n---\n\n${body}\n`;

test("no contract file changed: nothing needed", () => {
  const r = repo({ [`${API}/core.json`]: { symbols: [] }, "src/a.ts": "1" });
  r.write("src/a.ts", "2");
  r.commit();
  assert.equal(r.run().code, 0);
  r.done();
});

test("an API report changed and the changeset names its package: passes", () => {
  const r = repo({ [`${API}/react.json`]: { symbols: [] } });
  r.write(`${API}/react.json`, { symbols: [{ name: "x" }] });
  r.write(".changeset/one.md", changeset(["@design-system/react"]));
  r.commit();
  assert.equal(r.run().code, 0);
  r.done();
});

test("an API report changed and the changeset names another package: refused, naming the gap", () => {
  const r = repo({ [`${API}/react.json`]: { symbols: [] } });
  r.write(`${API}/react.json`, { symbols: [{ name: "x" }] });
  r.write(".changeset/one.md", changeset(["@design-system/svelte"]));
  r.commit();
  const { code, out } = r.run();
  assert.equal(code, 1);
  assert.match(out, /@design-system\/react changed and is not named/);
  r.done();
});

test("a prop manifest: only the frameworks whose section changed are required", () => {
  const before = { frameworks: { svelte: { props: [1] }, vue: { props: [1] } } };
  const r = repo({ [`${PROPS}/button.json`]: before });
  r.write(`${PROPS}/button.json`, {
    frameworks: { svelte: { props: [1] }, vue: { props: [1, 2] } },
  });
  r.write(".changeset/one.md", changeset(["@design-system/vue"]));
  r.commit();
  assert.equal(r.run().code, 0);
  r.write(".changeset/one.md", changeset(["@design-system/svelte"]));
  r.commit();
  assert.match(r.run().out, /@design-system\/vue changed and is not named/);
  r.done();
});

test("a token: every adapter that ships it must be named", () => {
  const token = (v) => ({ name: "--ds-x", adapters: ["svelte", "vue"], resolved: v });
  const r = repo({ [REGISTRY]: { tokens: [token(1)], componentTokens: [] } });
  r.write(REGISTRY, { tokens: [token(2)], componentTokens: [] });
  r.write(".changeset/one.md", changeset(["@design-system/svelte"]));
  r.commit();
  assert.match(r.run().out, /@design-system\/vue changed and is not named/);
  r.write(".changeset/one.md", changeset(["@design-system/svelte", "@design-system/vue"]));
  r.commit();
  assert.equal(r.run().code, 0);
  r.done();
});

test("an empty changeset, or a deleted one, satisfies nothing", () => {
  const r = repo({
    [`${API}/core.json`]: { symbols: [] },
    ".changeset/old.md": changeset(["@design-system/core"]),
  });
  r.write(`${API}/core.json`, { symbols: [1] });
  r.write(".changeset/new.md", changeset(["@design-system/core"], ""));
  r.commit();
  assert.match(r.run().out, /empty/);
  r.done();
});

// The file list and the file contents have to be read at the same commit.
// Reading the list at the merge base and the contents at the base branch's
// tip makes the gate answer for edits this branch never made, and miss ones
// it did.
test("a change the base branch made afterwards is not this branch's to answer for", () => {
  const one = { frameworks: { svelte: { props: [1] } } };
  const other = { frameworks: { vue: { props: [1] } } };
  const r = repo({ [`${PROPS}/one.json`]: one, [`${PROPS}/other.json`]: other });
  r.write(`${PROPS}/one.json`, { frameworks: { svelte: { props: [1, 2] } } });
  r.write(".changeset/mine.md", changeset(["@design-system/svelte"]));
  r.commit();
  r.baseMovesOn({ [`${PROPS}/other.json`]: { frameworks: { vue: { props: [1, 2] } } } });

  const result = r.run();
  assert.equal(result.code, 0, result.out);
  r.done();
});

test("a change this branch made counts even if the base made the same one", () => {
  const manifest = { frameworks: { svelte: { props: [1] }, vue: { props: [1] } } };
  const r = repo({ [`${PROPS}/one.json`]: manifest });
  // This branch changes the vue section; the base branch then makes the very
  // same edit. Reading the contents at the base tip would call them equal.
  r.write(`${PROPS}/one.json`, {
    frameworks: { svelte: { props: [1] }, vue: { props: [1, 2] } },
  });
  r.write(".changeset/mine.md", changeset(["@design-system/svelte"]));
  r.commit();
  r.baseMovesOn({
    [`${PROPS}/one.json`]: { frameworks: { svelte: { props: [1] }, vue: { props: [1, 2] } } },
  });

  const result = r.run();
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /@design-system\/vue changed and is not named/);
  r.done();
});

// A changeset already on the base describes what was already released or
// already queued. Editing it is not this change describing itself.
test("editing a changeset that was already there satisfies nothing", () => {
  const r = repo({
    [`${API}/core.json`]: { symbols: ["a"] },
    ".changeset/theirs.md": changeset(["@design-system/core"], "Their change."),
  });
  r.write(`${API}/core.json`, { symbols: ["a", "b"] });
  r.write(".changeset/theirs.md", changeset(["@design-system/core"], "Their change, and mine."));
  r.commit();

  const result = r.run();
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /no changeset/i);
  r.done();
});

// Refused because there is nothing left to read, not because of the status
// letter: the added-only filter is what keeps an edited one out (above).
test("deleting a changeset someone else added satisfies nothing", () => {
  const r = repo({
    [`${API}/core.json`]: { symbols: ["a"] },
    ".changeset/theirs.md": changeset(["@design-system/core"]),
  });
  r.write(`${API}/core.json`, { symbols: ["a", "b"] });
  rmSync(join(r.dir, ".changeset/theirs.md"));
  r.commit();

  const result = r.run();
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /no changeset|empty/i);
  r.done();
});

test("an empty changeset does not speak for the packages it names", () => {
  const r = repo({
    [`${API}/core.json`]: { symbols: ["a"] },
    [`${API}/react.json`]: { symbols: ["a"] },
  });
  r.write(`${API}/core.json`, { symbols: ["a", "b"] });
  r.write(`${API}/react.json`, { symbols: ["a", "b"] });
  r.write(".changeset/empty.md", changeset(["@design-system/react"], ""));
  r.write(".changeset/real.md", changeset(["@design-system/core"]));
  r.commit();

  const result = r.run();
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /@design-system\/react changed and is not named/);
  r.done();
});
