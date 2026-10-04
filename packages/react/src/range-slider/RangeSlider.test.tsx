import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { RangeSlider, type RangeSliderProps } from "./RangeSlider";

const lower = () => screen.getByRole<HTMLInputElement>("slider", { name: "Minimum price" });
const upper = () => screen.getByRole<HTMLInputElement>("slider", { name: "Maximum price" });
const fillPercentages = () => {
  const root = document.querySelector(".range-slider") as HTMLElement;
  return [
    root.style.getPropertyValue("--_range-lower-pct"),
    root.style.getPropertyValue("--_range-upper-pct"),
  ];
};
// The value is set and the event fired inside `act`, so the microtask that
// writes the DOM default back has run before the assertions.
const move = (thumb: HTMLInputElement, value: string) =>
  act(async () => {
    fireEvent.change(thumb, { target: { value } });
  });
const reset = () =>
  act(async () => {
    (screen.getByTestId("form") as HTMLFormElement).reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const PAIR = [20, 80] as const;

const Fixture = (props: Partial<RangeSliderProps>) => (
  <form data-testid="form">
    <RangeSlider
      value={PAIR}
      label="Price"
      thumbLabels={["Minimum price", "Maximum price"]}
      {...props}
    />
  </form>
);

describe("React RangeSlider", () => {
  it("renders both thumbs at their given values, DOM order lower then upper", () => {
    render(<Fixture />);
    expect(lower()).toHaveValue("20");
    expect(upper()).toHaveValue("80");
    const sliders = screen.getAllByRole("slider");
    expect(sliders[0]).toBe(lower());
    expect(sliders[1]).toBe(upper());
    expect(screen.getByRole("group", { name: "Price" })).toContainElement(lower());
  });

  it("reports the complete pair, once, from a single thumb's input", async () => {
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    await move(lower(), "30");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith([30, 80]);
  });

  it("clamps the moved thumb against the sibling plus minDistance, without crossing", async () => {
    const onValueChange = vi.fn();
    render(<Fixture value={[20, 60]} minDistance={5} onValueChange={onValueChange} />);
    // Requesting past the sibling: the clamp, not the raw request, wins.
    await move(lower(), "90");
    expect(onValueChange).toHaveBeenLastCalledWith([55, 60]);
    expect(upper(), "the sibling stays").toHaveValue("60");
  });

  it("reports nothing when a request clamps back to the value it started from", async () => {
    const onValueChange = vi.fn();
    render(<Fixture value={[55, 60]} minDistance={5} onValueChange={onValueChange} />);
    // Already at the boundary; the same clamp is not a change.
    await move(lower(), "58");
    expect(onValueChange).not.toHaveBeenCalled();
    // The native input moved to 58 on its own; the control puts it back.
    expect(lower()).toHaveValue("55");
  });

  it("reflects a controlled value change silently", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture onValueChange={onValueChange} />);
    rerender(<Fixture value={[30, 70]} onValueChange={onValueChange} />);
    expect(lower()).toHaveValue("30");
    expect(upper()).toHaveValue("70");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does not churn on a fresh array holding the same pair", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture value={[20, 80]} onValueChange={onValueChange} />);
    await move(lower(), "30");
    // A parent that writes the pair it already had as a new array changes nothing.
    rerender(<Fixture value={[20, 80]} onValueChange={onValueChange} />);
    expect(lower()).toHaveValue("30");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("normalizes an invalid controlled value the same way a drag would be", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture minDistance={10} onValueChange={onValueChange} />);
    rerender(<Fixture value={[50, 52]} minDistance={10} onValueChange={onValueChange} />);
    expect(lower()).toHaveValue("50");
    expect(upper()).toHaveValue("60");
    // The next drag clamps against the normalized pair, not the raw one.
    await move(lower(), "55");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(lower()).toHaveValue("50");
  });

  it("does not treat a partial echo (one position matches, one does not) as give-back", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture onValueChange={onValueChange} />);
    await move(lower(), "30");
    expect(onValueChange).toHaveBeenLastCalledWith([30, 80]);
    // The application echoes the reported lower back, but changes upper too:
    // not an echo, a real choice, so it becomes the new default.
    rerender(<Fixture value={[30, 90]} onValueChange={onValueChange} />);
    expect(lower().defaultValue).toBe("30");
    expect(upper().defaultValue).toBe("90");
    await reset();
    expect(lower()).toHaveValue("30");
    expect(upper()).toHaveValue("90");
  });

  it("disables both thumbs and removes them from FormData", () => {
    render(<Fixture disabled name="price" />);
    expect(lower()).toBeDisabled();
    expect(upper()).toBeDisabled();
    expect([...new FormData(screen.getByTestId("form") as HTMLFormElement).keys()]).toEqual([]);
  });

  it("submits two ordered values under one name", () => {
    render(<Fixture name="price" />);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).getAll("price")).toEqual(["20", "80"]);
  });

  it("carries a normalized DOM default for both thumbs", () => {
    render(<Fixture value={[50, 52]} minDistance={10} />);
    expect(lower().defaultValue).toBe("50");
    expect(upper().defaultValue).toBe("60");
  });

  it("restores both thumbs and the fill to the current default on a reset, reporting nothing", async () => {
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    await move(lower(), "40");
    await move(upper(), "90");
    // The DOM defaults are what a script-free reset would use.
    expect(lower().defaultValue).toBe("20");
    expect(upper().defaultValue).toBe("80");
    await reset();
    expect(lower()).toHaveValue("20");
    expect(upper()).toHaveValue("80");
    // The native reset moves the DOM values alone; the fill follows only when
    // the control put its own pair back too.
    expect(fillPercentages()).toEqual(["20%", "80%"]);
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("updates the default after a prop change, and restores the new default", async () => {
    const { rerender } = render(<Fixture />);
    rerender(<Fixture value={[30, 70]} />);
    expect(lower().defaultValue).toBe("30");
    expect(upper().defaultValue).toBe("70");
    await move(lower(), "10");
    await reset();
    expect(lower()).toHaveValue("30");
  });

  it("keeps a float-step dependent bound exactly on the grid", async () => {
    const onValueChange = vi.fn();
    render(
      <Fixture
        value={[0.6, 0.9]}
        min={0}
        max={1}
        step={0.1}
        minDistance={0.3}
        onValueChange={onValueChange}
      />,
    );
    expect(lower()).toHaveAttribute("aria-valuemax", "0.6");
    expect(upper()).toHaveAttribute("aria-valuemin", "0.9");
    await move(lower(), "0.7");
    await move(upper(), "0.8");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(lower()).toHaveValue("0.6");
    expect(upper()).toHaveValue("0.9");
  });

  it("reads reversed bounds as min and max in either order", async () => {
    const onValueChange = vi.fn();
    render(<Fixture value={[30, 70]} min={100} max={0} onValueChange={onValueChange} />);
    expect(lower()).toHaveAttribute("min", "0");
    expect(lower()).toHaveAttribute("max", "100");
    await move(lower(), "50");
    expect(onValueChange).toHaveBeenLastCalledWith([50, 70]);
  });

  it("draws one tick per grid point, none for a max the grid does not reach", () => {
    render(<Fixture value={[0, 90]} min={0} max={95} step={10} ticks />);
    const ticks = Array.from(document.querySelectorAll<HTMLElement>(".range-slider__tick"));
    expect(ticks).toHaveLength(10);
    expect(ticks[0]!.style.getPropertyValue("--_tick-pct")).toBe("0%");
    expect(parseFloat(ticks[9]!.style.getPropertyValue("--_tick-pct"))).toBeCloseTo(94.74, 1);
  });

  it("carries the dependent bound and a localized aria-valuetext naming it", () => {
    render(<Fixture minDistance={5} />);
    expect(lower()).toHaveAttribute("aria-valuemax", "75");
    expect(upper()).toHaveAttribute("aria-valuemin", "25");
    expect(lower()).toHaveAttribute("aria-valuetext", "20, minimum; may not exceed 75");
    expect(upper()).toHaveAttribute("aria-valuetext", "80, maximum; may not go below 25");
  });

  it("raises the thumb that can move, so a press lands on it", () => {
    render(<Fixture value={[100, 100]} />);
    // Both at the top: only the lower one can move, so it rests on top.
    expect(lower().style.zIndex).toBe("2");
    expect(upper().style.zIndex).toBe("1");
  });

  describe("reflects a constraint changed after mount", () => {
    it("max, and a pair it no longer allows is normalized silently, reset default included", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<Fixture onValueChange={onValueChange} />);
      rerender(<Fixture max={50} onValueChange={onValueChange} />);
      expect(upper()).toHaveAttribute("max", "50");
      expect(upper()).toHaveValue("50");
      expect(upper().defaultValue, "the reset default follows").toBe("50");
      expect(onValueChange).not.toHaveBeenCalled();

      await move(lower(), "40");
      expect(onValueChange).toHaveBeenCalledWith([40, 50]);
      await reset();
      expect(lower()).toHaveValue("20");
      expect(upper()).toHaveValue("50");
    });

    it("step, snapping the held pair onto the new grid", () => {
      const { rerender } = render(<Fixture value={[22, 78]} />);
      rerender(<Fixture value={[22, 78]} step={5} />);
      expect(lower()).toHaveValue("20");
      expect(upper()).toHaveValue("80");
      expect(lower().defaultValue).toBe("20");
    });

    it("min, with the fill following", () => {
      const { rerender } = render(<Fixture />);
      rerender(<Fixture min={10} />);
      expect(lower()).toHaveAttribute("aria-valuemin", "10");
      expect(fillPercentages().map((p) => Math.round(parseFloat(p)))).toEqual([11, 78]);
    });

    it("disabled, both ways", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(<Fixture name="price" disabled onValueChange={onValueChange} />);
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(new FormData(form).getAll("price")).toEqual([]);
      rerender(<Fixture name="price" onValueChange={onValueChange} />);
      expect(new FormData(form).getAll("price")).toEqual(["20", "80"]);
      rerender(<Fixture name="price" disabled onValueChange={onValueChange} />);
      await move(lower(), "30");
      expect(onValueChange, "a disabled control reports nothing").not.toHaveBeenCalled();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Fixture showValue showRange ticks step={10} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
