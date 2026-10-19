import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  tokenEntries,
  modeTokens,
  resolveTokens,
  validateTokenModel,
  rgba,
  channelByte,
} from "./token-model.mjs";
import { prepareFiles } from "./prepare-token-reform.mjs";

const tree = JSON.parse(readFileSync(new URL("../packages/tokens/tokens.json", import.meta.url)));
const manifest = JSON.parse(
  readFileSync(new URL("../packages/tokens/migration-v2.json", import.meta.url)),
);

test("the reform has 132 exact palette steps plus White and Black", () => {
  const palette = tokenEntries(tree).filter(([path]) => path.startsWith("colors.palette."));
  assert.equal(palette.length, 134);
  assert.equal(validateTokenModel(tree), tokenEntries(tree).length);
});

// Values changed on purpose after the reform. The manifest stays pinned to the
// reform baseline; docs/tokens.md records why each one changed.
const changedAfterReform = new Set([
  // Dark secondary Button fill and label keep the Light contrast with the page.
  "role.dark.color-secondary-surface",
  "role.dark.color-on-secondary-surface",
]);

test("all migration values and recipe references are preserved in both modes", () => {
  for (const entry of manifest.entries) {
    if (entry.retired || changedAfterReform.has(entry.from)) continue;
    const token = modeTokens(tree, entry.mode ?? "light").get(entry.to);
    assert.deepEqual(token.$value, entry.after.$value, entry.from);
    assert.deepEqual(
      token.$extensions?.["com.invisible-ui.mix"],
      entry.after.$extensions?.["com.invisible-ui.mix"],
      entry.from,
    );
    assert.equal(token.$type, entry.type);
  }
});

test("all derived values retain their rounded channels and alpha", () => {
  for (const mode of ["light", "dark"]) {
    const resolved = resolveTokens(tree, { mode });
    for (const [path, token] of modeTokens(tree, mode)) {
      if (!token.$extensions?.["com.invisible-ui.mix"]) continue;
      const expected = rgba(token.$value);
      const actual = rgba(resolved.get(path));
      assert.deepEqual(
        actual.components.map(channelByte),
        expected.components.map(channelByte),
        path,
      );
      assert.ok(Math.abs(actual.alpha - expected.alpha) < 0.00001, path);
    }
  }
});

test("tenant aliases and literals propagate without changing the palette", () => {
  const baseline = resolveTokens(tree);
  for (const value of ["{colors.palette.cobalt-blue.500}", "#123456"]) {
    const result = resolveTokens(tree, { overrides: { "colors.brand.primary.default": value } });
    assert.notDeepEqual(
      result.get("components.general.action.primary.background.default"),
      baseline.get("components.general.action.primary.background.default"),
    );
    assert.notDeepEqual(
      result.get("components.general.action.secondary.contextual.background.default"),
      baseline.get("components.general.action.secondary.contextual.background.default"),
    );
    assert.deepEqual(
      result.get("colors.palette.dioxazine-purple.500"),
      baseline.get("colors.palette.dioxazine-purple.500"),
    );
    assert.deepEqual(
      result.get("colors.feedback.success.default"),
      baseline.get("colors.feedback.success.default"),
    );
  }
});

test("shared background propagates and Card's explicit override is isolated", () => {
  const overrides = {
    "components.general.background.default": "#123456",
    "components.card.background.default": "#654321",
  };
  const result = resolveTokens(tree, { overrides });
  assert.equal(result.get("components.page.background.default"), "#123456");
  assert.equal(result.get("components.dialog.background.default"), "#123456");
  assert.equal(result.get("components.card.background.default"), "#654321");
});

test("invalid overrides, missing references, type mismatches and cycles fail", () => {
  for (const overrides of [
    { missing: "#000000" },
    { "colors.palette.grey.50": "#000000" },
    { "colors.brand.primary.default": "red; background: url(x)" },
    { "colors.brand.primary.default": "{metrics.radius.control}" },
    { "colors.brand.primary.default": "{colors.brand.primary.default}" },
  ])
    assert.throws(() => resolveTokens(tree, { overrides }));
  const bad = structuredClone(tree);
  bad.colors.brand.primary.default.$value = "{missing.token}";
  assert.throws(() => validateTokenModel(bad), /Missing token/);
});

test("migration preparation is deterministic and matches the pinned source", async () => {
  await prepareFiles({ check: true });
});
