import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSheet, resolveColor } from "./generate-token-registry.mjs";
import { modeTokens, resolveTokens, cssName, rgba, channelByte } from "./token-model.mjs";
import { cssExpression } from "./tokens-css-format.mjs";

const tree = JSON.parse(readFileSync(new URL("../packages/tokens/tokens.json", import.meta.url)));
const styles = ["svelte/src/lib", "react/src", "vue/src", "elements/src"].map((adapter) =>
  readFileSync(new URL(`../packages/${adapter}/styles/tokens.css`, import.meta.url), "utf8"),
);
const declarations = parseSheet(styles[0]);
const normalized = (value) => value.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
const layer = (name) =>
  new Map(declarations.filter((d) => d.layer === name).map((d) => [d.name, normalized(d.value)]));
const selectionFallbacks = new Map([
  ["components.general.selection.background.default", "#7a52cc"],
  ["components.general.selection.foreground.default", "#fff"],
]);

test("all adapters ship the same theme", () => {
  for (const sheet of styles) assert.equal(sheet, styles[0]);
});

for (const mode of ["light", "dark"])
  test(`every canonical token matches runtime CSS in ${mode}`, () => {
    const lookup = (name) =>
      (mode === "dark" ? layer("darkAttr").get(name) : undefined) ??
      layer("light").get(name) ??
      layer("other").get(name);
    const resolved = resolveTokens(tree, { mode });
    for (const [path, token] of modeTokens(tree, mode)) {
      const expression = lookup(cssName(path));
      assert.ok(expression, `Missing ${path}`);
      const canonicalExpression = cssExpression(token);
      const fallback = selectionFallbacks.get(path);
      assert.equal(
        expression,
        fallback ? canonicalExpression.replace(/\)$/, `, ${fallback})`) : canonicalExpression,
        `${path}: preserve reference`,
      );
      if (token.$type === "color") {
        const actual = resolveColor(expression, lookup);
        const expected = rgba(resolved.get(path));
        assert.ok(actual, `${path}: ${expression}`);
        assert.deepEqual(
          actual.slice(0, 3).map((v) => Math.round(v)),
          expected.components.map(channelByte),
          path,
        );
        assert.ok(Math.abs((actual[3] ?? 1) - expected.alpha) < 0.00001, `${path}: alpha`);
      } else {
        let actual = expression;
        const seen = new Set();
        while (/^var\((--ds-[\w-]+)\)$/.test(actual)) {
          assert.ok(!seen.has(actual), path);
          seen.add(actual);
          actual = lookup(/^var\((--ds-[\w-]+)\)$/.exec(actual)[1]);
        }
        assert.equal(actual, String(resolved.get(path)), path);
      }
    }
  });

test("automatic dark mode equals explicit dark mode", () => {
  assert.deepEqual(layer("darkMedia"), layer("darkAttr"));
});
