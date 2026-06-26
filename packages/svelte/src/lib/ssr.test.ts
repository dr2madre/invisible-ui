// @vitest-environment node
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";

// SSR guarantee: every component (via its fixture, which supplies valid props)
// must server-render to an HTML string without touching the DOM. Overlays and
// portal-based components are the risk points — in their default (closed) state
// they should emit just their trigger, never reach for `document`/`window`.
const fixtures = import.meta.glob("./**/*.fixture.svelte", { eager: true });

describe("SSR — fixtures render to HTML without throwing", () => {
  const entries = Object.entries(fixtures);

  it("found fixtures to test", () => {
    expect(entries.length).toBeGreaterThan(30);
  });

  for (const [path, mod] of entries) {
    it(path.replace("./", ""), () => {
      const Component = (mod as { default: unknown }).default as Parameters<typeof render>[0];
      const { body } = render(Component);
      expect(typeof body).toBe("string");
    });
  }
});
