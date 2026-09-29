// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sheet = readFileSync(fileURLToPath(new URL("../styles/avatar.css", import.meta.url)), "utf8");

// An item's `color` reaches the sheet through `--ds-avatar-bg`. In the
// `background` shorthand a value like `url(…)` would load an image; in
// `background-color` it is only ever a color, or nothing.
describe("avatar color", () => {
  it("feeds --ds-avatar-bg only to background-color", () => {
    const uses = sheet
      .split(";")
      .filter((declaration) => declaration.includes("var(--ds-avatar-bg"))
      .map((declaration) =>
        declaration.slice(0, declaration.indexOf(":")).trim().split(/\s/).pop(),
      );
    expect(uses.length).toBeGreaterThan(0);
    expect(new Set(uses)).toEqual(new Set(["background-color"]));
  });
});
