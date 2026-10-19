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
  assert.deepEqual(transformValue("0.75rem", "dimension"), {
    value: 12,
    unit: "px",
  });
  assert.deepEqual(transformValue("24px", "dimension"), {
    value: 24,
    unit: "px",
  });
});

test("references keep their canonical path and transparent becomes a zero-alpha colour", () => {
  assert.equal(
    transformValue("{components.general.background.default}", "color"),
    "{components.general.background.default}",
  );
  assert.deepEqual(transformValue("transparent", "color"), colorObject("#000000", 0));
});

test("the repository source produces matching Light and Dark collections", () => {
  const modes = generate(source);
  assert.equal(tokenCount(modes.light), tokenCount(source));
  assert.equal(tokenCount(modes.dark), tokenCount(source));
  assert.equal(modes.light.typography["font-weight"].heading.$type, "number");
  const background = (mode) => modes[mode].components.general.background.default.$value;
  assert.equal(background("light"), "{colors.palette.grey.0}");
  assert.equal(background("dark"), "{colors.palette.grey.900}");
  assert.deepEqual(modes.light.metrics.density.touch["min-target-size"].$value, {
    value: 44,
    unit: "px",
  });
  assert.equal(JSON.stringify(modes).includes("com.invisible-ui"), false);
});

test("a mode override replaces the Light value and a mix exports its resolved colour", () => {
  const modes = generate(source);
  const hover = (mode) => modes[mode].components.button.background.secondary.hover.$value.hex;
  assert.equal(hover("light"), "#DFD5F3");
  assert.equal(hover("dark"), "#3B314F");
});

test("a reference to a missing token fails", () => {
  const broken = structuredClone(source);
  broken.components.button.radius.$value = "{metrics.radius.missing}";
  assert.throws(() => buildMode(broken, "light"), /missing token metrics.radius.missing/);
});
