import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { modeTokens, resolveTokens } from "./token-model.mjs";
const tree = JSON.parse(readFileSync(new URL("../packages/tokens/tokens.json", import.meta.url)));

test("no generic container group survives", () => {
  assert.equal(tree.components.general.container, undefined);
});
for (const mode of ["light", "dark"])
  test(`Button default and ghost inherit the same hover in ${mode}`, () => {
    const tokens = modeTokens(tree, mode);
    for (const path of ["background.hover", "background.ghost.hover"])
      assert.equal(
        tokens.get(`components.button.${path}`).$value,
        "{components.general.background.hover}",
      );
    const resolved = resolveTokens(tree, {
      mode,
      overrides: { "components.general.background.hover": "#123456" },
    });
    assert.equal(resolved.get("components.button.background.hover"), "#123456");
    assert.equal(resolved.get("components.button.background.ghost.hover"), "#123456");
  });
test("Button override does not change the shared background or Card", () => {
  const original = resolveTokens(tree);
  const changed = resolveTokens(tree, {
    overrides: { "components.button.background.default": "#123456" },
  });
  assert.equal(changed.get("components.button.background.default"), "#123456");
  for (const path of [
    "components.general.background.default",
    "components.card.background.default",
  ])
    assert.deepEqual(changed.get(path), original.get(path));
});
for (const file of [
  "packages/svelte/src/lib/button/Button.svelte",
  ...["react", "vue", "elements"].map((a) => `packages/${a}/src/styles/button.css`),
])
  test(`${file} reads Button tokens without legacy overrides`, () => {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /--ds-button-|general-container/);
    for (const variant of ["default", "primary", "secondary", "ghost", "danger"]) {
      const block = source.match(
        new RegExp(`\\[data-variant="${variant}"\\][^{]*:hover[^{}]*\\{([^}]+)\\}`),
      );
      assert.ok(block, variant);
      const suffix = variant === "default" ? "" : `${variant}-`;
      assert.ok(block[1].includes(`var(--ds-components-button-background-${suffix}hover)`));
    }
  });
