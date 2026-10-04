import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Slider } from "./Slider";

const slider = () => screen.getByRole<HTMLInputElement>("slider", { name: "Volume" });
const move = (value: string) =>
  act(async () => {
    fireEvent.change(slider(), { target: { value } });
  });
const fill = () =>
  (document.querySelector(".slider") as HTMLElement).style.getPropertyValue("--_slider-pct");

describe("React Slider (native range)", () => {
  it("exposes a labelled slider at the right value", () => {
    render(<Slider label="Volume" value={30} />);
    expect(slider()).toHaveAttribute("type", "range");
    expect(slider()).toHaveValue("30");
    expect(fill()).toBe("30%");
  });

  it("reports snapped value changes from input, once each", async () => {
    const onValueChange = vi.fn();
    render(<Slider label="Volume" value={30} step={10} onValueChange={onValueChange} />);
    await move("52");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(50);
    expect(slider()).toHaveValue("50");
    expect(fill()).toBe("50%");
  });

  it("does not change when disabled", async () => {
    const onValueChange = vi.fn();
    render(<Slider label="Volume" value={30} disabled onValueChange={onValueChange} />);
    expect(slider()).toBeDisabled();
    await move("60");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("mirrors a controlled value without reporting, and ignores a value that is not a number", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Slider label="Volume" value={30} onValueChange={onValueChange} />);
    rerender(<Slider label="Volume" value={70} onValueChange={onValueChange} />);
    expect(slider()).toHaveValue("70");
    rerender(<Slider label="Volume" value={Number.NaN} onValueChange={onValueChange} />);
    expect(slider()).toHaveValue("70");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("accepts input once a slider mounted disabled is enabled", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Slider label="Volume" value={30} disabled onValueChange={onValueChange} />,
    );
    rerender(<Slider label="Volume" value={30} onValueChange={onValueChange} />);
    await move("40");
    expect(onValueChange).toHaveBeenCalledWith(40);
  });

  it("follows bounds changed after mount, reporting nothing", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Slider label="Volume" value={80} onValueChange={onValueChange} />);
    rerender(<Slider label="Volume" value={80} max={50} onValueChange={onValueChange} />);
    expect(slider()).toHaveAttribute("max", "50");
    expect(slider()).toHaveValue("50");
    expect(fill()).toBe("100%");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("shows the value, the range and the ticks it is asked for", () => {
    render(
      <Slider
        label="Volume"
        value={25}
        step={25}
        showValue
        showRange
        ticks
        format={(value) => `${value}%`}
      />,
    );
    expect(document.querySelector(".slider-field__value")).toHaveTextContent("25%");
    expect(document.querySelector(".slider-field__range")).toHaveTextContent("0%100%");
    expect(document.querySelectorAll(".slider__tick")).toHaveLength(5);
  });

  it("submits the current value under the field name", async () => {
    render(
      <form data-testid="form">
        <Slider label="Volume" name="volume" value={30} />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("volume")).toBe("30");
    await move("45");
    expect(new FormData(form).get("volume")).toBe("45");
  });

  it("keeps the DOM default after an edit, and restores it on reset, reporting nothing", async () => {
    const onValueChange = vi.fn();
    render(
      <form data-testid="form">
        <Slider label="Volume" name="volume" value={30} onValueChange={onValueChange} />
      </form>,
    );
    await move("45");
    expect(slider().defaultValue, "the DOM default must not follow the edit").toBe("30");
    await act(async () => {
      (screen.getByTestId("form") as HTMLFormElement).reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(slider()).toHaveValue("30");
    expect(fill(), "the control's own copy came back too").toBe("30%");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Slider label="Volume" value={30} showValue showRange />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
