import { get } from "svelte/store";
import { describe, expect, it, vi } from "vitest";
import { createCarousel } from "./create-carousel";

// `syncConfig` reflects a slide count and a loop flag the page changed after
// mount. It is a reflection, so it reports nothing, and a config that changed
// nothing must not wake the page either: the styled component calls it from a
// reactive block that runs on every parent render.
describe("createCarousel syncConfig", () => {
  const counted = (count: number, loop = false) => {
    const f = createCarousel({ count, loop, orientation: "horizontal" });
    const seen = vi.fn();
    // The first call carries the current value, which is not a change.
    const stop = f.state.subscribe(seen);
    seen.mockClear();
    return { f, seen, stop };
  };

  it("does not wake a subscriber when nothing changed", () => {
    const { f, seen, stop } = counted(5);
    f.syncConfig({ count: 5, loop: false, orientation: "horizontal" });
    f.syncConfig({ count: 5, loop: false, orientation: "horizontal" });
    expect(seen).toHaveBeenCalledTimes(0);
    stop();
  });

  it("wakes a subscriber once per real change", () => {
    const { f, seen, stop } = counted(5);
    f.syncConfig({ count: 4, loop: false, orientation: "horizontal" });
    expect(seen).toHaveBeenCalledTimes(1);
    f.syncConfig({ count: 4, loop: true, orientation: "horizontal" });
    expect(seen).toHaveBeenCalledTimes(2);
    stop();
  });

  it("clamps the active slide into a shorter list, silently", () => {
    const onIndexChange = vi.fn();
    const f = createCarousel({ count: 5, onIndexChange });
    f.goTo(4);
    onIndexChange.mockClear();

    f.syncConfig({ count: 2, loop: false, orientation: "horizontal" });

    expect(get(f.state).index).toBe(1);
    expect(onIndexChange, "a clamp is not a choice the page made").not.toHaveBeenCalled();
  });

  it("leaves an index a longer list can still hold", () => {
    const f = createCarousel({ count: 5 });
    f.goTo(3);
    f.syncConfig({ count: 8, loop: false, orientation: "horizontal" });
    expect(get(f.state).index).toBe(3);
    expect(get(f.state).count).toBe(8);
  });

  it("holds an empty list at the first slide", () => {
    const f = createCarousel({ count: 3 });
    f.goTo(2);
    f.syncConfig({ count: 0, loop: false, orientation: "horizontal" });
    expect(get(f.state).index).toBe(0);
  });

  it("follows an orientation changed after mount", () => {
    const { f, seen, stop } = counted(5);
    f.syncConfig({ count: 5, loop: false, orientation: "vertical" });
    expect(get(f.state).orientation).toBe("vertical");
    expect(seen).toHaveBeenCalledTimes(1);
    stop();
  });
});
