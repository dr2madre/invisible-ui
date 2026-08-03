import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Slider } from "./Slider";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

// Built on a native <input type="range">: the slider role, ARIA value and
// keyboard control are the browser's job (jsdom does not move a range on arrow
// keys, which E2E covers). These tests simulate the browser's `input` event to
// cover the wiring we own: snapping, reporting and the styled anatomy.
describe("Vue Slider (styled)", () => {
  it("renders a labelled slider at the right value", () => {
    render(Slider, { props: { value: 25, label: "Brightness" } });
    expect(screen.getByRole<HTMLInputElement>("slider", { name: "Brightness" })).toHaveValue("25");
  });

  it("reports snapped value changes from input", async () => {
    const onValueChange = vi.fn();
    render(Slider, { props: { value: 50, step: 25, label: "Volume", onValueChange } });
    const slider = screen.getByRole<HTMLInputElement>("slider");

    await fireEvent.update(slider, "80");
    expect(onValueChange).toHaveBeenLastCalledWith(75); // snapped to the nearest 25
    expect(slider).toHaveValue("75");
  });

  it("supports v-model: emits update:modelValue on input", async () => {
    const { emitted } = render(Slider, {
      props: { modelValue: 10, step: 10, label: "Volume" },
    });
    await fireEvent.update(screen.getByRole("slider"), "20");
    expect(emitted("update:modelValue")).toEqual([[20]]);
  });

  it("mirrors an externally controlled value", async () => {
    const { rerender } = render(Slider, { props: { value: 20, label: "Volume" } });
    await rerender({ value: 80 });
    expect(screen.getByRole("slider")).toHaveValue("80");
  });

  it("does not change when disabled", async () => {
    const onValueChange = vi.fn();
    render(Slider, { props: { value: 30, disabled: true, label: "Volume", onValueChange } });
    const slider = screen.getByRole<HTMLInputElement>("slider");
    expect(slider).toBeDisabled();

    await fireEvent.update(slider, "80");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clamps the value into the range and carries the orientation", () => {
    render(Slider, {
      props: { value: 999, min: 0, max: 10, orientation: "vertical", label: "Volume" },
    });
    const slider = screen.getByRole<HTMLInputElement>("slider");
    expect(slider).toHaveValue("10");
    expect(slider).toHaveAttribute("aria-orientation", "vertical");
  });

  it("shows the formatted value and the range ends on request", () => {
    const { container } = render(Slider, {
      props: {
        value: 40,
        label: "Volume",
        showValue: true,
        showRange: true,
        format: (value: number) => `${value}%`,
      },
    });
    expect(container.querySelector(".slider-field__value")).toHaveTextContent("40%");
    expect(container.querySelector(".slider-field__range")).toHaveTextContent("0%");
    expect(container.querySelector(".slider-field__range")).toHaveTextContent("100%");
  });

  it("draws a tick per step while the count stays readable", () => {
    const { container } = render(Slider, {
      props: { value: 0, min: 0, max: 40, step: 10, ticks: true, label: "Volume" },
    });
    expect(container.querySelectorAll(".slider__tick")).toHaveLength(5);
  });

  it("drops the ticks when the steps would crowd the track", () => {
    const { container } = render(Slider, {
      props: { value: 0, step: 1, ticks: true, label: "Volume" },
    });
    expect(container.querySelectorAll(".slider__tick")).toHaveLength(0);
  });

  it("submits the current value under the field name", async () => {
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(Slider, { label: "Volume", name: "volume", value: 30 }),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("volume")).toBe("30");

    await fireEvent.update(screen.getByRole("slider"), "70");
    expect(new FormData(form).get("volume")).toBe("70");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Slider, { props: { value: 60, label: "Volume" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
