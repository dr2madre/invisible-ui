import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, h, type PropType } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { RangeSlider } from "./RangeSlider";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const lower = () => screen.getByRole<HTMLInputElement>("slider", { name: "Minimum price" });
const upper = () => screen.getByRole<HTMLInputElement>("slider", { name: "Maximum price" });
const fillPercentages = () => {
  const root = document.querySelector(".range-slider") as HTMLElement;
  return [
    root.style.getPropertyValue("--_range-lower-pct"),
    root.style.getPropertyValue("--_range-upper-pct"),
  ];
};

type Pair = readonly [number, number];

// A `<form>`-wrapping fixture, the same shape the Svelte adapter's own
// `.fixture.svelte` uses: FormData and native reset only exist inside a real
// form, and `rerender` needs one stable component instance to reflect onto.
const Fixture = defineComponent({
  props: {
    value: { type: Array as unknown as PropType<Pair>, default: () => [20, 80] },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    minDistance: { type: Number, default: 0 },
    disabled: { type: Boolean, default: false },
    orientation: { type: String as PropType<"horizontal" | "vertical">, default: "horizontal" },
    name: { type: String, default: undefined },
    onValueChange: { type: Function as PropType<(value: Pair) => void>, default: undefined },
  },
  setup(props) {
    return () =>
      h("form", { "data-testid": "form" }, [
        h(RangeSlider, {
          value: props.value,
          min: props.min,
          max: props.max,
          step: props.step,
          minDistance: props.minDistance,
          disabled: props.disabled,
          orientation: props.orientation,
          name: props.name,
          label: "Price",
          thumbLabels: ["Minimum price", "Maximum price"],
          onValueChange: props.onValueChange,
        }),
      ]);
  },
});

// Built on two native <input type="range"> elements: the slider role, ARIA
// value and keyboard control are the browser's job (E2E covers those). These
// tests simulate the browser's `input` event to cover the wiring we own: the
// clamp, reporting and the styled anatomy.
describe("Vue RangeSlider (styled)", () => {
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
    await fireEvent.update(lower(), "30");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith([30, 80]);
  });

  it("clamps the moved thumb against the sibling plus minDistance, without crossing", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: [30, 60], minDistance: 5, onValueChange } });
    // Requesting past the sibling: the clamp, not the raw request, wins.
    await fireEvent.update(lower(), "90");
    expect(onValueChange).toHaveBeenLastCalledWith([55, 60]);
  });

  it("does not move the sibling thumb when one is clamped", async () => {
    render(Fixture, { props: { value: [30, 60], minDistance: 5 } });
    await fireEvent.update(lower(), "90");
    expect(upper()).toHaveValue("60");
  });

  it("reports nothing when a request clamps back to the value it started from", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: [55, 60], minDistance: 5, onValueChange } });
    // Already at the boundary; the same clamp is not a change.
    await fireEvent.update(lower(), "58");
    expect(onValueChange).not.toHaveBeenCalled();
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
    const { rerender } = render(Fixture, { props: { value: [20, 80] } });
    await rerender({ value: [90, 10] }); // crossed: upper clamps to lower
    expect(lower()).toHaveValue("90");
    expect(upper()).toHaveValue("90");
  });

  it("does not treat a partial echo (one position matches, one does not) as give-back", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, { props: { value: [20, 80], onValueChange } });
    await fireEvent.update(lower(), "30");
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
    await fireEvent.update(lower(), "40");
    await fireEvent.update(upper(), "90");
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
    expect(fillPercentages()).toEqual(["20%", "80%"]);
  });

  it("updates the default after a prop change, and restores the new default", async () => {
    const { rerender } = render(Fixture, { props: { value: [20, 80] } });
    await rerender({ value: [30, 70] });
    expect(lower().defaultValue).toBe("30");
    expect(upper().defaultValue).toBe("70");

    await fireEvent.update(lower(), "10");
    const form = screen.getByTestId("form") as HTMLFormElement;
    form.reset();
    await new Promise((r) => setTimeout(r, 0));
    expect(lower()).toHaveValue("30");
  });

  it("carries the dependent bound through an explicit aria override", () => {
    render(Fixture, { props: { value: [20, 80], minDistance: 5 } });
    expect(lower()).toHaveAttribute("aria-valuemax", "75");
    expect(upper()).toHaveAttribute("aria-valuemin", "25");
  });

  it("gives each thumb a localized value text naming the live dependent bound", () => {
    render(Fixture, { props: { value: [20, 80], minDistance: 5 } });
    expect(lower()).toHaveAttribute("aria-valuetext", "20, minimum; may not exceed 75");
    expect(upper()).toHaveAttribute("aria-valuetext", "80, maximum; may not go below 25");
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
      await fireEvent.update(lower(), "40");
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
      // and report it: here [40, 80] over a max of 50.
      const onValueChange = vi.fn();
      const { rerender } = render(Fixture, { props: { value: [20, 80], onValueChange } });
      await rerender({ value: [20, 80], max: 50, onValueChange });
      expect(onValueChange).not.toHaveBeenCalled();
      await fireEvent.update(lower(), "40");
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
      await fireEvent.update(lower(), "30");
      expect(onValueChange, "a disabled control reports nothing").not.toHaveBeenCalled();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: [20, 80] } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
