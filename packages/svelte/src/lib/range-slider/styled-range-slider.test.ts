import { render, screen } from "@testing-library/svelte";
import { fireEvent } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./range-slider.fixture.svelte";

const lower = () => screen.getByRole<HTMLInputElement>("slider", { name: "Minimum price" });
const upper = () => screen.getByRole<HTMLInputElement>("slider", { name: "Maximum price" });
const fillPercentages = () => {
  const root = document.querySelector(".range-slider") as HTMLElement;
  return [
    root.style.getPropertyValue("--_range-lower-pct"),
    root.style.getPropertyValue("--_range-upper-pct"),
  ];
};

describe("Svelte RangeSlider", () => {
  it("renders both thumbs at their given values, DOM order lower then upper", () => {
    render(Fixture, { props: { value: [20, 80] } });
    expect(lower()).toHaveValue("20");
    expect(upper()).toHaveValue("80");
    const sliders = screen.getAllByRole("slider");
    expect(sliders[0]).toBe(lower());
    expect(sliders[1]).toBe(upper());
  });

  it("reports the complete pair, once, from a single thumb's input", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: [20, 80], onValueChange } });
    await fireEvent.input(lower(), { target: { value: "30" } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith([30, 80]);
  });

  it("clamps the moved thumb against the sibling plus minDistance, without crossing", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: [20, 60], minDistance: 5, onValueChange } });
    // Requesting past the sibling: the clamp, not the raw request, wins.
    await fireEvent.input(lower(), { target: { value: "90" } });
    expect(onValueChange).toHaveBeenLastCalledWith([55, 60]);
  });

  it("does not move the sibling thumb when one is clamped", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: [20, 60], minDistance: 5, onValueChange } });
    await fireEvent.input(lower(), { target: { value: "90" } });
    expect(upper()).toHaveValue("60");
  });

  it("reports nothing when a request clamps back to the value it started from", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: [55, 60], minDistance: 5, onValueChange } });
    // Already at the boundary; the same clamp is not a change.
    await fireEvent.input(lower(), { target: { value: "58" } });
    expect(onValueChange).not.toHaveBeenCalled();
    // The native input moved to 58 on its own; the control puts it back.
    expect(lower()).toHaveValue("55");
  });

  it("reflects a controlled value change silently", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, { props: { value: [20, 80], onValueChange } });
    await rerender({ value: [30, 70], onValueChange });
    expect(lower()).toHaveValue("30");
    expect(upper()).toHaveValue("70");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("normalizes an invalid controlled value the same way a drag would be", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, {
      props: { value: [20, 80], minDistance: 10, onValueChange },
    });
    await rerender({ value: [50, 52], minDistance: 10, onValueChange });
    expect(lower()).toHaveValue("50");
    expect(upper()).toHaveValue("60");
    // The next drag clamps against the normalized pair, not the raw one: a
    // raw [50, 52] would let the lower thumb slide down to 42.
    await fireEvent.input(lower(), { target: { value: "55" } });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(lower()).toHaveValue("50");
  });

  it("does not treat a partial echo (one position matches, one does not) as give-back", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, { props: { value: [20, 80], onValueChange } });
    await fireEvent.input(lower(), { target: { value: "30" } });
    expect(onValueChange).toHaveBeenLastCalledWith([30, 80]);
    // The application echoes the reported lower back, but changes upper too:
    // not an echo, a real choice, so it becomes the new default.
    onValueChange.mockClear();
    await rerender({ value: [30, 90], onValueChange });
    expect(lower().defaultValue).toBe("30");
    expect(upper().defaultValue).toBe("90");

    const form = screen.getByTestId("form") as HTMLFormElement;
    form.reset();
    await new Promise((r) => setTimeout(r, 0));
    expect(lower()).toHaveValue("30");
    expect(upper()).toHaveValue("90");
  });

  it("disables both thumbs and removes them from FormData", () => {
    render(Fixture, { props: { value: [20, 80], disabled: true, name: "price" } });
    expect(lower()).toBeDisabled();
    expect(upper()).toBeDisabled();
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect([...new FormData(form).keys()]).toEqual([]);
  });

  it("submits two ordered values under one name", () => {
    render(Fixture, { props: { value: [20, 80], name: "price" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).getAll("price")).toEqual(["20", "80"]);
  });

  it("carries a normalized DOM default for both thumbs", () => {
    render(Fixture, { props: { value: [50, 52], minDistance: 10 } });
    expect(lower().defaultValue).toBe("50");
    expect(upper().defaultValue).toBe("60");
  });

  it("restores both thumbs to the current default on a native reset, with no script reading the defaults", async () => {
    render(Fixture, { props: { value: [20, 80] } });
    await fireEvent.input(lower(), { target: { value: "40" } });
    await fireEvent.input(upper(), { target: { value: "90" } });
    // The DOM defaults are what a script-free reset would use.
    expect(lower().defaultValue).toBe("20");
    expect(upper().defaultValue).toBe("80");

    const form = screen.getByTestId("form") as HTMLFormElement;
    form.reset();
    await new Promise((r) => setTimeout(r, 0));
    expect(lower()).toHaveValue("20");
    expect(upper()).toHaveValue("80");
    // The native reset alone moves the DOM value; only the adapter's own
    // reset handler re-syncs its internal state, which drives the fill bar.
    // Checking only the DOM value above would pass even if that handler
    // never ran, since a native reset restores each input's own value on
    // its own.
    expect(fillPercentages()).toEqual(["20%", "80%"]);
  });

  it("updates the default after a prop change, and restores the new default", async () => {
    const { rerender } = render(Fixture, { props: { value: [20, 80] } });
    await rerender({ value: [30, 70] });
    expect(lower().defaultValue).toBe("30");
    expect(upper().defaultValue).toBe("70");

    await fireEvent.input(lower(), { target: { value: "10" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    form.reset();
    await new Promise((r) => setTimeout(r, 0));
    expect(lower()).toHaveValue("30");
  });

  it("keeps a float-step dependent bound exactly on the grid", async () => {
    // 0.9 - 0.3 is 0.6000000000000001 in floating point. Exact equality on
    // purpose: an off-grid bound reads as garbage to assistive technology and
    // turns a clamp that changed nothing into a reported change.
    const onValueChange = vi.fn();
    render(Fixture, {
      props: { value: [0.6, 0.9], min: 0, max: 1, step: 0.1, minDistance: 0.3, onValueChange },
    });
    expect(lower()).toHaveAttribute("aria-valuemax", "0.6");
    expect(upper()).toHaveAttribute("aria-valuemin", "0.9");
    await fireEvent.input(lower(), { target: { value: "0.7" } });
    await fireEvent.input(upper(), { target: { value: "0.8" } });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(lower()).toHaveValue("0.6");
    expect(upper()).toHaveValue("0.9");
  });

  it("reads reversed bounds as min and max in either order", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: [30, 70], min: 100, max: 0, onValueChange } });
    expect(lower()).toHaveAttribute("min", "0");
    expect(lower()).toHaveAttribute("max", "100");
    expect(lower()).toHaveValue("30");
    expect(upper()).toHaveValue("70");
    // The clamp reads the same ordered bounds, not the raw props.
    await fireEvent.input(lower(), { target: { value: "50" } });
    expect(onValueChange).toHaveBeenLastCalledWith([50, 70]);
  });

  it("draws one tick per grid point, none for a max the grid does not reach", () => {
    render(Fixture, { props: { value: [0, 90], min: 0, max: 95, step: 10, ticks: true } });
    const ticks = Array.from(document.querySelectorAll<HTMLElement>(".range-slider__tick"));
    expect(ticks).toHaveLength(10);
    expect(ticks[0].style.getPropertyValue("--_tick-pct")).toBe("0%");
    // 90 of 95, not 100%: the last tick marks a value the arrows can reach.
    expect(parseFloat(ticks[9].style.getPropertyValue("--_tick-pct"))).toBeCloseTo(94.74, 1);
  });

  it("carries the dependent bound through an explicit aria override", () => {
    render(Fixture, { props: { value: [20, 80], minDistance: 5 } });
    expect(lower()).toHaveAttribute("aria-valuemax", "75");
    expect(upper()).toHaveAttribute("aria-valuemin", "25");
  });

  it("carries a localized aria-valuetext naming the live bound", () => {
    render(Fixture, { props: { value: [20, 80], minDistance: 5 } });
    expect(lower()).toHaveAttribute("aria-valuetext", expect.stringContaining("20"));
    expect(lower()).toHaveAttribute("aria-valuetext", expect.stringContaining("75"));
  });

  // Constraints changed after mount reach the machine, the DOM, the fill and
  // the dependent bounds without a remount, report nothing, and where they
  // leave the pair invalid, normalize it and the reset default together.
  describe("reflects a constraint changed after mount", () => {
    it("min", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(Fixture, { props: { value: [20, 80], onValueChange } });
      await rerender({ value: [20, 80], min: 10, onValueChange });
      expect(lower()).toHaveAttribute("min", "10");
      expect(upper()).toHaveAttribute("min", "10");
      expect(lower()).toHaveAttribute("aria-valuemin", "10");
      // (20 - 10) / 90 and (80 - 10) / 90 of the track.
      expect(fillPercentages().map((p) => Math.round(parseFloat(p)))).toEqual([11, 78]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("max, and a pair it no longer allows is normalized silently, reset default included", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(Fixture, { props: { value: [20, 80], onValueChange } });
      await rerender({ value: [20, 80], max: 50, onValueChange });
      expect(upper()).toHaveAttribute("max", "50");
      expect(upper()).toHaveAttribute("aria-valuemax", "50");
      expect(upper()).toHaveValue("50");
      expect(lower()).toHaveValue("20");
      expect(upper().defaultValue, "the reset default follows").toBe("50");
      expect(onValueChange).not.toHaveBeenCalled();

      const form = screen.getByTestId("form") as HTMLFormElement;
      await fireEvent.input(lower(), { target: { value: "40" } });
      form.reset();
      await new Promise((r) => setTimeout(r, 0));
      expect(lower()).toHaveValue("20");
      expect(upper()).toHaveValue("50");
    });

    it("step, snapping the held pair onto the new grid", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(Fixture, { props: { value: [22, 78], onValueChange } });
      await rerender({ value: [22, 78], step: 5, onValueChange });
      expect(lower()).toHaveAttribute("step", "5");
      expect(lower()).toHaveValue("20");
      expect(upper()).toHaveValue("80");
      expect(lower().defaultValue).toBe("20");
      expect(upper().defaultValue).toBe("80");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("minDistance, pushing the pair apart and moving the dependent bound", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(Fixture, { props: { value: [50, 52], onValueChange } });
      await rerender({ value: [50, 52], minDistance: 10, onValueChange });
      expect(upper()).toHaveValue("60");
      expect(lower()).toHaveAttribute("aria-valuemax", "50");
      expect(upper()).toHaveAttribute("aria-valuemin", "60");
      expect(upper().defaultValue).toBe("60");
      expect(onValueChange).not.toHaveBeenCalled();
      // The bound announced is the effective one too.
      expect(lower()).toHaveAttribute("aria-valuetext", expect.stringContaining("50"));
    });

    it("orientation", async () => {
      const { rerender } = render(Fixture, { props: { value: [20, 80] } });
      expect(lower()).toHaveAttribute("aria-orientation", "horizontal");
      await rerender({ value: [20, 80], orientation: "vertical" });
      expect(lower()).toHaveAttribute("aria-orientation", "vertical");
      expect(upper()).toHaveAttribute("aria-orientation", "vertical");
      expect(document.querySelector(".range-slider")).toHaveAttribute(
        "data-orientation",
        "vertical",
      );
      expect(lower()).toHaveAttribute("data-orientation", "vertical");
    });

    it("a drag after a constraint change reports a pair the new constraints allow", async () => {
      // The clamp reads the held pair. If a constraint change left that pair
      // stale, a later drag would clamp against a bound that no longer exists
      // and report it: here [40, 80] over a max of 50. Only the constraint
      // changes: the value prop keeps its identity, as it does in an app that
      // changes a bound and nothing else.
      const onValueChange = vi.fn();
      const { rerender } = render(Fixture, { props: { value: [20, 80], onValueChange } });
      await rerender({ max: 50 });
      expect(onValueChange).not.toHaveBeenCalled();
      await fireEvent.input(lower(), { target: { value: "40" } });
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith([40, 50]);
    });

    it("disabled, both ways", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(Fixture, {
        props: { value: [20, 80], name: "price", onValueChange },
      });
      await rerender({ value: [20, 80], name: "price", disabled: true, onValueChange });
      expect(lower()).toBeDisabled();
      expect(upper()).toBeDisabled();
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(new FormData(form).getAll("price")).toEqual([]);

      await rerender({ value: [20, 80], name: "price", disabled: false, onValueChange });
      expect(lower()).toBeEnabled();
      expect(new FormData(form).getAll("price")).toEqual(["20", "80"]);

      // Disabled again: an input event that a real browser would never
      // deliver to a disabled control still reports nothing here.
      await rerender({ value: [20, 80], name: "price", disabled: true, onValueChange });
      await fireEvent.input(lower(), { target: { value: "30" } });
      expect(onValueChange, "a disabled control reports nothing").not.toHaveBeenCalled();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: [20, 80] } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
