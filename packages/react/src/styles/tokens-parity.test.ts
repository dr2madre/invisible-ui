// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The React adapter ships its own copy of the runtime token stylesheet so the
// package is self-contained when published. That copy must never drift from
// the Svelte adapter's: the two adapters render the same design system, and a
// silent divergence would show up as adapters that look subtly different.
//
// This mirrors the Svelte package's own tokens-parity test, which guards the
// DTCG source (tokens.json) against the same stylesheet.

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

describe("token stylesheet parity", () => {
  it("matches the Svelte adapter's tokens.css exactly", () => {
    const react = read("./tokens.css");
    const svelte = read("../../../svelte/src/lib/styles/tokens.css");

    expect(react).toBe(svelte);
  });
});
