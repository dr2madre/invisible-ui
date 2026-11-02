import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  extractButtonStyles,
  extractCardLayout,
  generatePlugin,
} from "./generate-figma-components.mjs";

test("Button default and hover backgrounds and disabled opacity follow component CSS", () => {
  const button = readFileSync(
    new URL("../packages/svelte/src/lib/button/Button.svelte", import.meta.url),
    "utf8",
  );
  const tokens = JSON.parse(
    readFileSync(new URL("../packages/tokens/tokens.json", import.meta.url), "utf8"),
  );
  const styles = extractButtonStyles(button, tokens);
  assert.equal(styles.defaultBackground, "components.button.background.default");
  assert.equal(styles.hoverBackground, "components.button.background.hover");
  assert.equal(styles.disabledOpacity, 0.5);
  const changed = structuredClone(tokens);
  changed.components.button.opacity.disabled.$value = 0.4;
  const updated = extractButtonStyles(
    button.replace(
      "background: var(--ds-components-button-background-default)",
      "background: var(--ds-components-card-background-default)",
    ),
    changed,
  );
  assert.equal(updated.defaultBackground, "components.card.background.default");
  assert.equal(updated.disabledOpacity, 0.4);
  assert.throws(
    () =>
      extractButtonStyles(
        button.replace(
          "background: var(--ds-components-button-background-default)",
          "background: var(--ds-button-unknown)",
        ),
        tokens,
      ),
    /unsupported background/,
  );
});

const source = readFileSync(
  new URL("../packages/svelte/src/lib/card/Card.svelte", import.meta.url),
  "utf8",
);

test("Default and Ghost share the captured hover background in both themes", () => {
  const { themes } = JSON.parse(
    readFileSync(
      new URL("../tools/figma-component-pilot/button-appearance.json", import.meta.url),
      "utf8",
    ),
  );
  for (const theme of Object.values(themes)) {
    assert.deepEqual(theme.default.hover.background, theme.ghost.hover.background);
    assert.deepEqual(theme.default.hover.border, theme.default.default.border);
    assert.deepEqual(theme.default.hover.foreground, theme.default.default.foreground);
  }
});

test("Card CSS determines media width, alignment and body spacing", () => {
  const layout = extractCardLayout(source);
  assert.equal(layout.horizontal.mediaWidth, 128);
  assert.equal(layout.vertical.mediaAlign, "STRETCH");
  assert.equal(layout.horizontal.mediaAlign, "STRETCH");
  const changed = source
    .replace("--ds-card-horizontal-media-size, 8rem", "--ds-card-horizontal-media-size, 10rem")
    .replace("--ds-card-padding, 1rem", "--ds-card-padding, 24px")
    .replace("--ds-card-gap, 0.5rem", "--ds-card-gap, 0.75rem");
  const updated = extractCardLayout(changed);
  assert.equal(updated.horizontal.mediaWidth, 160);
  assert.equal(updated.body.padding, 24);
  assert.equal(updated.body.gap, 12);
});

test("unsupported Card CSS fails instead of silently keeping an old layout", () => {
  assert.throws(
    () =>
      extractCardLayout(
        source.replace(
          "--ds-card-horizontal-media-size, 8rem",
          "--ds-card-horizontal-media-size, 30%",
        ),
      ),
    /unsupported dimension/,
  );
  assert.throws(() => extractCardLayout(source.replace("flex: none", "flex: 1")), /media flex/);
  assert.throws(
    () => extractCardLayout(source.replace("align-self: stretch", "align-self: center")),
    /unsupported layout/,
  );
});

test("the runnable Figma plugin matches its component source and adapter", async () => {
  const current = readFileSync(
    new URL("../tools/figma-component-pilot/code.js", import.meta.url),
    "utf8",
  );
  assert.equal(current, await generatePlugin());
});
