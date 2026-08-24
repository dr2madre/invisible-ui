import { render } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Fixture from "./upload-drop-area.fixture.svelte";

// Opening the picker listens for the window regaining focus, which is how the
// component learns the dialog closed. If the area goes away while the picker
// is still open, that listener has nothing left to tell and nobody to remove
// it: one per open, for the life of the page.

afterEach(() => vi.restoreAllMocks());

describe("UploadDropArea teardown", () => {
  it("takes its focus listener with it", async () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const count = (spy: typeof added) => spy.mock.calls.filter(([type]) => type === "focus").length;

    for (let cycle = 0; cycle < 5; cycle += 1) {
      const view = render(Fixture);
      const input = view.container.querySelector("input[type=file]")!;
      // Opening the picker is what registers the listener.
      input.dispatchEvent(new Event("click", { bubbles: true }));
      view.unmount();
    }

    expect(count(added), "the picker was opened five times").toBe(5);
    expect(count(removed), "and let go five times").toBe(5);
  });
});
