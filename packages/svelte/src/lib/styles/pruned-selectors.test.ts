// @vitest-environment node
import { readFileSync } from "node:fs";
import { compile } from "svelte/compiler";
import { describe, expect, it } from "vitest";

// The compiler drops a scoped rule when nothing in the template can match it,
// and `data-*` state attributes come from the actions at runtime, so a rule
// written as `.calendar__day[data-selected]` never reaches the built CSS: the
// styling silently disappears from the published package. Wrapping the
// attribute in `:global(...)` keeps the rule, still scoped by its class.
// This test compiles every component and fails on that pruning.

const components = Object.keys(import.meta.glob("../**/*.svelte"))
  .filter((path) => !path.endsWith(".fixture.svelte"))
  .sort();

const resolve = (path: string) => new URL(path, import.meta.url);

describe("scoped state styles", () => {
  it("cover the whole styled catalog", () => {
    expect(components.length).toBeGreaterThan(70);
  });

  it("survive compilation", () => {
    const pruned = components.flatMap((file) => {
      const { warnings } = compile(readFileSync(resolve(file), "utf8"), {
        filename: file,
        generate: false,
      });
      return warnings
        .filter((warning) => warning.code === "css_unused_selector")
        .map((warning) => `${file}: ${warning.message}`);
    });

    expect(pruned).toEqual([]);
  });
});
