import { get } from "svelte/store";
import { describe, expect, it } from "vitest";
import { createRangeSlider } from "./create-range-slider";

// The composable's own contract, where the store is visible: the styled
// component's tests cover what reaches the page.
describe("createRangeSlider", () => {
  it("has already committed the pair by the time it reports it", () => {
    // Reporting from inside `store.update` hands the consumer a store that
    // still holds the old pair, and swallows whatever the consumer writes
    // from its own handler: the updater's return value lands afterwards and
    // wins. Both are silent, so the order is asserted here.
    const seen: Array<readonly [number, number]> = [];
    let stateDuringReport: readonly [number, number] | null = null;

    const slider = createRangeSlider({
      value: [20, 80],
      onValueChange: (next) => {
        seen.push(next);
        stateDuringReport = get(slider.state).value;
      },
    });

    slider.setValue(0, 30);

    expect(seen).toEqual([[30, 80]]);
    expect(stateDuringReport).toEqual([30, 80]);
  });

  it("does not lose a write made from inside the handler", () => {
    const slider = createRangeSlider({
      value: [20, 80],
      onValueChange: (next) => {
        // A consumer that refuses the change and puts its own pair back.
        if (next[0] === 30) slider.syncValue([10, 80]);
      },
    });

    slider.setValue(0, 30);
    expect(get(slider.state).value).toEqual([10, 80]);
  });
});
