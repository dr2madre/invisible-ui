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
  return {
    dir,
    write,
    commit() {
      git("add", "-A");
      git("commit", "-q", "-m", "head");
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
