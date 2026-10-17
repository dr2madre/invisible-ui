import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildMode, colorObject, generate, transformValue } from "./generate-figma-tokens.mjs";

const source = JSON.parse(
  readFileSync(new URL("../packages/tokens/tokens.json", import.meta.url), "utf8"),
);

function tokenCount(node) {
  if (Object.hasOwn(node, "$value")) return 1;
  return Object.entries(node).reduce(
    (count, [key, child]) => count + (key.startsWith("$") ? 0 : tokenCount(child)),
    0,
  );
}

test("colours become structured sRGB values", () => {
  assert.deepEqual(colorObject("#7a52cc", 0.3), {
    colorSpace: "srgb",
    components: [122 / 255, 82 / 255, 204 / 255],
    alpha: 0.3,
    hex: "#7A52CC",
  });
});

test("dimensions become pixels with a 16px root", () => {
  assert.deepEqual(transformValue("0.75rem", "dimension", "light"), {
    value: 12,
    unit: "px",
  });
  assert.deepEqual(transformValue("24px", "dimension", "light"), {
    value: 24,
    unit: "px",
  });
});

test("theme role references collapse to one shared Figma path", () => {
  assert.equal(
    transformValue("{role.dark.color-primary}", "color", "dark"),
    "{role.color-primary}",
  );
  assert.throws(
    () => transformValue("{role.light.color-primary}", "color", "dark"),
    /dark mode refers to the light mode/,
  );
});

test("the repository source produces matching Light and Dark collections", () => {
  const modes = generate(source);
  const sharedCount = ["palette", "style", "radius", "focus", "typography"].reduce(
    (count, group) => count + tokenCount(source[group]),
    0,
  );
  assert.equal(tokenCount(modes.light), sharedCount + tokenCount(source.role.light));
  assert.equal(tokenCount(modes.dark), sharedCount + tokenCount(source.role.dark));
  assert.equal(modes.light.typography["heading-weight"].$type, "number");
  assert.deepEqual(modes.light.role["color-background"].$value, "{palette.grey.0}");
  assert.deepEqual(modes.dark.role["color-background"].$value, "{palette.grey.900}");
  assert.equal(Object.hasOwn(modes.light, "density"), false);
});

test("one mode rejects a missing source group", () => {
  const incomplete = structuredClone(source);
  delete incomplete.focus;
  assert.throws(() => buildMode(incomplete, "light"), /missing the focus group/);
});
