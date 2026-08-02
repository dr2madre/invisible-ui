import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/vue";
import * as matchers from "vitest-axe/matchers";
import { afterEach, expect, vi } from "vitest";

// Mirrors the Svelte and React adapters' setup: colour contrast can't be
// resolved in jsdom (no layout, no real cascade), so the rule is disabled
// repo-wide and contrast is covered by the token tests instead.
vi.mock("vitest-axe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vitest-axe")>();

  return {
    ...actual,
    axe: actual.configureAxe({
      rules: {
        "color-contrast": { enabled: false },
      },
    }),
  };
});

expect.extend(matchers);

// Testing Library's Vue adapter does not auto-clean when `globals` is on
// unless the setup registers it.
afterEach(cleanup);

// jsdom's canvas API is intentionally incomplete; axe-core may touch it.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}
